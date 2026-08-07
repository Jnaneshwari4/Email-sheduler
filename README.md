# Email Scheduler SaaS

A full-stack Email Scheduler project with a React frontend, Express backend, PostgreSQL database, Redis queueing, and BullMQ worker processing.

## Features

- Google sign-in authentication
- Email scheduling for future delivery
- Background worker processing with BullMQ + Redis
- PostgreSQL persistence via Prisma
- SMTP-based email dispatch
- Rate limiting and retry handling
- Queue health monitoring

## Requirements

- Node.js 20+ / npm
- Docker Desktop (for PostgreSQL and Redis)

## Setup

### 1. Install dependencies

From the repository root:

```powershell
npm install
```

### 2. Start infrastructure

```powershell
npm run docker:up
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 3. Configure backend environment

Create `backend/.env` with these values:

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://email_scheduler:email_scheduler_pass@localhost:5432/email_scheduler_db
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

WORKER_CONCURRENCY=1
MAX_EMAILS_PER_HOUR=100
MIN_DELAY_SECONDS=10
```

> Replace the placeholder values with your own credentials.

### 4. Generate Prisma client and migrate database

From the repository root:

```powershell
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start the backend API

```powershell
npm run dev:backend
```

### 6. Start the worker

```powershell
npm run dev:worker
```

### 7. Start the frontend

```powershell
npm run dev:frontend
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Project structure

- `backend/`: Express API, Prisma models, Redis queue, and worker logic
- `frontend/`: React app with login, email scheduling, and dashboard
- `docker-compose.yml`: PostgreSQL and Redis services

## Backend API routes

- `POST /api/v1/auth/google` — login with Google token
- `POST /api/v1/auth/logout` — logout
- `GET /api/v1/profile` — get current user profile
- `GET /api/v1/senders` — list senders
- `POST /api/v1/senders` — create a sender
- `POST /api/v1/emails/schedule` — schedule emails
- `GET /api/v1/emails/scheduled` — list scheduled emails
- `GET /api/v1/emails/sent` — list sent emails
- `DELETE /api/v1/emails/scheduled/:id` — delete one scheduled email
- `POST /api/v1/emails/scheduled/delete` — delete multiple scheduled emails
- `GET /api/v1/queues/health` — queue health status
- `GET /api/v1/health` — system health check

## Demo script

1. Start Docker, backend, worker, and frontend.
2. Open the frontend and log in.
3. Add or confirm a sender record.
4. Schedule one or more emails for a future time.
5. View scheduled emails and queue health.
6. Show worker logs as it dispatches email jobs.
7. Optionally stop/restart the API or worker and confirm queued jobs remain intact.

## Notes

- The application reads backend config from `backend/.env`.
- The frontend uses `http://localhost:4000/api/v1` by default.
- The worker uses Redis to store delayed and retryable jobs.

## Stop Docker

```powershell
npm run docker:down
```
