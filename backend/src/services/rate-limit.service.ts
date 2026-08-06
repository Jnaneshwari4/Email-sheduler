import { env } from "../config/env";
import { redisConnection } from "../config/redis";

type RateLimitDecision =
  | {
      allowed: true;
      currentHourStartMs: number;
      currentCount: number;
    }
  | {
      allowed: false;
      rescheduleAt: Date;
      sequence: number;
      nextHourStartMs: number;
    };

export class RateLimitService {
  private readonly maxEmailsPerHour = env.MAX_EMAILS_PER_HOUR;
  private readonly minDelayMs = env.MIN_DELAY_SECONDS * 1000;

  async reserveSlotOrGetReschedule(): Promise<RateLimitDecision> {
    const now = new Date();
    const currentHourStartMs = this.getHourStartMs(now);
    const nextHourStartMs = currentHourStartMs + 60 * 60 * 1000;
    const currentHourKey = `rate-limit:email-hour:${currentHourStartMs}`;
    const backlogKey = `rate-limit:email-backlog-seq:${nextHourStartMs}`;

    const hourTtlMs = Math.max(60_000, nextHourStartMs - now.getTime() + 120_000);
    const backlogTtlMs = 7 * 24 * 60 * 60 * 1000;

    const script = `
      local currentKey = KEYS[1]
      local backlogKey = KEYS[2]
      local currentTtlMs = tonumber(ARGV[1])
      local backlogTtlMs = tonumber(ARGV[2])
      local maxPerHour = tonumber(ARGV[3])

      local current = tonumber(redis.call('GET', currentKey) or '0')

      if current < maxPerHour then
        local newCount = redis.call('INCR', currentKey)
        if newCount == 1 then
          redis.call('PEXPIRE', currentKey, currentTtlMs)
        end
        return {1, newCount, 0}
      end

      local sequence = redis.call('INCR', backlogKey)
      if sequence == 1 then
        redis.call('PEXPIRE', backlogKey, backlogTtlMs)
      end

      return {0, current, sequence}
    `;

    const result = (await redisConnection.eval(
      script,
      2,
      currentHourKey,
      backlogKey,
      String(hourTtlMs),
      String(backlogTtlMs),
      String(this.maxEmailsPerHour)
    )) as [number, number, number];

    const isAllowed = result[0] === 1;

    if (isAllowed) {
      return {
        allowed: true,
        currentHourStartMs,
        currentCount: result[1]
      };
    }

    const sequence = result[2];
    const spacingMs = Math.max(this.minDelayMs, Math.ceil((60 * 60 * 1000) / this.maxEmailsPerHour));
    const scheduledAtMs = nextHourStartMs + (sequence - 1) * spacingMs;

    return {
      allowed: false,
      sequence,
      nextHourStartMs,
      rescheduleAt: new Date(scheduledAtMs)
    };
  }

  private getHourStartMs(date: Date): number {
    const normalized = new Date(date);
    normalized.setMinutes(0, 0, 0);
    return normalized.getTime();
  }
}
