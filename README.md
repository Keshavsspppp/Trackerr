# Job Application Tracker

A full-stack personal web app to track job applications through their entire lifecycle — from first apply to offer or rejection. Built with Next.js, MongoDB, and Google OAuth.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Google OAuth sign-in** via NextAuth.js — no passwords to manage
- **Full CRUD** — create, update, delete, and filter job applications
- **Dashboard stats** — total applications, per-status breakdown, interview rate
- **Status filtering** — view applications by Applied / Interview / Offer / Rejected
- **Daily email reminders** — Vercel Cron + Resend notifies you about stale applications (no follow-up in 7+ days)
- **JWT sessions** — stateless, scales horizontally without DB lookups per request
- **Property-based tests** — fast-check validates correctness properties across random inputs

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Auth | NextAuth.js v4 + Google OAuth |
| Database | MongoDB Atlas via Mongoose |
| Email | Resend |
| Scheduling | Vercel Cron Jobs |
| Testing | Vitest + fast-check |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster
- A [Google Cloud](https://console.cloud.google.com/) project with OAuth 2.0 credentials
- A [Resend](https://resend.com/) account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/jobtracker.git
cd jobtracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your values:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Atlas connection string — e.g. `mongodb+srv://user:pass@cluster.mongodb.net/jobtracker` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing — run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → Credentials |
| `RESEND_API_KEY` | From your Resend dashboard |
| `CRON_SECRET` | Random secret to protect the cron endpoint — run `openssl rand -base64 32` |

### 4. Set up Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/):

1. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application)
2. Add **Authorized JavaScript origins**: `http://localhost:3000`
3. Add **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### 5. Whitelist your IP in MongoDB Atlas

Network Access → Add IP Address → Add Current IP Address (or `0.0.0.0/0` for **local dev only**)

**⚠️ Security Warning**: Never use `0.0.0.0/0` in production. For Vercel deployments, either:
- Add Vercel's IP ranges (see [Vercel docs](https://vercel.com/docs/security/deployment-protection))
- Use Atlas Private Endpoints (recommended for production)

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

---

## Running Tests

```bash
npm test               # run all tests once
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

The test suite includes **50 tests** across 7 files — unit tests and property-based tests using fast-check.

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with SessionProvider
│   ├── page.tsx                # Landing / sign-in page
│   ├── dashboard/
│   │   ├── page.tsx            # Server Component — fetches data from DB
│   │   └── DashboardClient.tsx # Client Component — filter state + refresh
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth handler
│       ├── applications/       # GET list, POST create, PATCH update, DELETE
│       ├── applications/stats/ # GET aggregated stats
│       └── cron/reminders/     # Daily stale-app reminder job
├── src/
│   ├── components/             # ApplicationForm, ApplicationList, StatsCards, StatusFilter
│   ├── lib/                    # mongodb.ts (connection), auth.ts (NextAuth config)
│   └── models/                 # Application Mongoose schema
├── proxy.ts                    # Auth middleware (Next.js 16)
├── vercel.json                 # Cron job schedule (daily 09:00 UTC)
└── .env.example                # Environment variable template
```

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from the table above in Vercel → Settings → Environment Variables
4. Add the production redirect URI in Google Cloud Console:
   `https://your-app.vercel.app/api/auth/callback/google`
5. Set `NEXTAUTH_URL=https://your-app.vercel.app` in Vercel env vars
6. Deploy — the cron job runs automatically daily at 09:00 UTC

**Note**: The cron schedule (`0 9 * * *` = 09:00 UTC daily) is defined in `vercel.json`. To change it:
- Edit the `schedule` field using [cron syntax](https://crontab.guru/)
- Example: `0 17 * * *` = 5 PM UTC (9 AM PST, 12 PM EST)

### Test the cron endpoint manually

```bash
curl -X GET https://your-app.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Monitoring & Observability

For production deployments, consider adding:

- **Vercel Analytics** — built-in traffic and performance metrics
  - Enable in Vercel Dashboard → Analytics
- **Sentry** — error tracking and alerting
  - Install: `npm install @sentry/nextjs`
  - Configure `sentry.client.config.ts` and `sentry.server.config.ts`
- **Custom logging** — structured logs with correlation IDs
  - Already sanitized for production via `src/lib/logger.ts`

---

## License

MIT
