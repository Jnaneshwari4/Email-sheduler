# Restart Testing Instructions

This guide verifies delayed BullMQ jobs survive API and worker restarts.

## Prerequisites

- Docker services for Redis and PostgreSQL are running.
- Backend API and worker can start successfully.
- At least one Sender record exists in the database.
- You have a valid Google ID token for authentication.

## 1. Start Infrastructure and Services

From the project root:

```powershell
npm run docker:up
npm run dev:backend
npm run dev:worker
```

## 2. Authenticate and Prepare Token

Use Postman collection file `testing/postman/email-scheduler.postman_collection.json`:

1. Run `Auth -> Login with Google Token`.
2. Confirm `accessToken` is auto-saved to collection variables.
3. Set `senderId` collection variable.

## 3. Schedule Delayed Jobs

Run `Emails -> Schedule Emails` with start time 2 to 5 minutes ahead.

Expected:

- API responds successfully.
- `Queue -> Queue Health` shows delayed/waiting jobs.

## 4. Restart API Only

1. Stop API process (Ctrl+C where backend is running).
2. Start API again: `npm run dev:backend`.
3. Call `Queue -> Queue Health`.

Expected:

- Delayed jobs still present.
- No job loss.

## 5. Restart Worker Only

1. Stop worker process (Ctrl+C where worker is running).
2. Wait 20 to 30 seconds.
3. Start worker again: `npm run dev:worker`.

Expected:

- Worker resumes consuming due jobs.
- Sent jobs transition to `SENT`.
- Failed jobs eventually move to `FAILED` only after retries.

## 6. Full Restart Scenario

1. Stop both API and worker.
2. Keep Redis/PostgreSQL containers running.
3. Start API then worker again.

Expected:

- Pending delayed jobs continue from Redis persistence.
- No duplicate sends caused by restarts.

## 7. Rate-Limit Deferral Verification

1. Set a low `MAX_EMAILS_PER_HOUR` (example: 2).
2. Restart API and worker after env change.
3. Schedule 5+ recipients in one campaign.

Expected:

- Early jobs send immediately.
- Excess jobs are deferred, not failed.
- Worker logs include: `Job deferred due to hourly limit`.

## 8. Evidence Checklist

Capture:

- Postman responses for auth/profile/schedule.
- Queue health snapshots before and after restarts.
- Worker logs showing resume + send + defer behavior.
- Database rows proving status transitions:
  - SCHEDULED -> PROCESSING -> SENT
  - SCHEDULED -> PROCESSING -> SCHEDULED (deferred)

## Troubleshooting

- If queue health fails, verify Redis container is healthy.
- If profile fails with 401, login again to refresh token.
- If sending fails, verify sender SMTP credentials (Ethereal values).
- If no jobs run, ensure worker process is running and using correct `.env`.
