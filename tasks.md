# Tasks — Job Application Tracker

## Features Summary

1. **Authentication** — Google OAuth login via NextAuth, JWT sessions, protected routes
2. **Application CRUD** — Create, list, update status, delete job applications
3. **Status Pipeline** — Enum-based status tracking (Applied → Interview → Offer/Rejected)
4. **Dashboard Stats** — Total applications, status breakdown, interview rate
5. **Email Reminders** — Daily cron job emails users about stale applications

---

## Week 1 — Setup, Auth, Data Layer

- [ ] Scaffold Next.js app (App Router, TypeScript)
- [ ] Create MongoDB Atlas cluster (free tier) + get connection string
- [ ] Install & configure Mongoose, create DB connection utility (cached connection for serverless)
- [ ] Set up Google Cloud OAuth credentials (client ID + secret)
- [ ] Install NextAuth + `@next-auth/mongodb-adapter`
- [ ] Configure NextAuth route (`/api/auth/[...nextauth]`), JWT session strategy
- [ ] Add sign-in / sign-out UI
- [ ] Add middleware to protect `/dashboard` and `/api/applications/*` routes
- [ ] Verify: sign in with Google creates a user doc in MongoDB

---

## Week 2 — Core CRUD

- [ ] Define Mongoose `Application` schema (company, role, status enum, appliedDate, jobUrl, notes, lastUpdated)
- [ ] Add indexes: `{ userId: 1 }` and `{ userId: 1, status: 1 }`
- [ ] `POST /api/applications` — create application
- [ ] `GET /api/applications` — list applications for logged-in user (support `?status=` query param)
- [ ] `PATCH /api/applications/[id]` — update status/notes, bump `lastUpdated`
- [ ] `DELETE /api/applications/[id]` — delete application
- [ ] Build application form (company, role, status dropdown, jobUrl, notes, appliedDate)
- [ ] Build applications list view with status badges
- [ ] Add inline status update (dropdown → PATCH)
- [ ] Add delete confirmation + action

---

## Week 3 — Dashboard & Stats

- [ ] `GET /api/applications/stats` — aggregation query (total count, count per status)
- [ ] Compute interview rate = (Interview + Offer) / Total
- [ ] Build dashboard summary cards (total, per-status counts, interview rate)
- [ ] (Optional) Add simple chart (bar/pie) for status distribution
- [ ] Add status filter to applications list (filter by Applied/Interview/Offer/Rejected)
- [ ] Add empty states (no applications yet) and loading states

---

## Week 4 — Email Reminders & Polish

- [ ] Set up Resend account, get API key, verify sender domain (or use test domain)
- [ ] Write reminder email template ("Follow up on your application to {company}")
- [ ] Add `lastReminderSent` field to Application schema
- [ ] Build `/api/cron/reminders` route — query stale applications (status "Applied", `lastUpdated` > 7 days), send emails, update `lastReminderSent`
- [ ] Protect cron route with secret header/token
- [ ] Configure Vercel Cron (`vercel.json`) to call reminder route daily
- [ ] Test cron job manually (curl with secret header)
- [ ] Error handling pass: API routes return proper status codes, form validation
- [ ] Deploy to Vercel, verify env vars (MongoDB URI, NextAuth secret, Google OAuth, Resend key)
- [ ] Final QA: full flow — sign in → add application → update status → check stats → receive reminder

---

## Interview Prep Checklist

- [ ] Be able to explain JWT vs database session tradeoffs
- [ ] Be able to explain why `{ userId: 1 }` index matters for query performance
- [ ] Be able to explain idempotency in the cron job (`lastReminderSent` prevents duplicate sends)
- [ ] Be able to explain why status is enforced as an enum at the Mongoose schema level
