import IORedis, { type RedisOptions } from "ioredis";
import { env } from "./env";

const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  tls: {},
  maxRetriesPerRequest: null,
  enableReadyCheck: true
};

export const redisConnection = new IORedis(redisOptions);

export function createRedisConnection(): IORedis {
  return new IORedis(redisOptions);
}
