# PRD — Job Application Tracker

## 1. Overview

A personal CRUD web app to track job applications: company, role, status, and follow-up dates. Built to learn production-grade authentication (NextAuth + Google OAuth), MongoDB data modeling, and scheduled background jobs (email reminders via cron).

**Difficulty:** Beginner-friendly
**Timeline:** 3–4 weeks
**Primary learning goal:** Authentication done correctly — every later project in the roadmap depends on this foundation.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Full-stack React framework |
| Database | MongoDB (Atlas free tier) | Document store, flexible schema |
| ODM | Mongoose | Schema validation + queries (Prisma alternative for Mongo) |
| Auth | NextAuth.js + Google OAuth | Use `@next-auth/mongodb-adapter` |
| Email | Resend (free tier) | Transactional email for reminders |
| Scheduling | Vercel Cron | Daily job to trigger reminder emails |
| Hosting | Vercel | Frontend + API routes |

---

## 3. Data Models

### User (managed by NextAuth's MongoDB adapter)
Automatically created on first Google sign-in. Fields: `_id`, `name`, `email`, `image`, `emailVerified`.

### Application
```js
{
  _id: ObjectId,
  userId: ObjectId,        // ref to User
  company: String,         // required
  role: String,            // required
  status: String,          // enum: "Applied" | "Interview" | "Offer" | "Rejected"
  appliedDate: Date,
  jobUrl: String,
  notes: String,
  lastUpdated: Date,        // used by cron to detect stale applications
  createdAt: Date
}
```

**Indexes:**
- `{ userId: 1 }` — every dashboard query is scoped to the logged-in user
- `{ userId: 1, status: 1 }` — for status-filtered views and stats

---

## 4. Core Features (MVP)

### 4.1 Authentication
- Google OAuth sign-in via NextAuth
- Session strategy: JWT (stateless, scales horizontally — no DB lookup per request)
- Protect all `/dashboard` and `/api/applications/*` routes via middleware

### 4.2 Application CRUD
- **Create:** Form with company, role, status (dropdown enum), appliedDate, jobUrl, notes
- **Read:** List view of all applications for logged-in user, filterable by status
- **Update:** Inline status change (dropdown → PATCH request, updates `lastUpdated`)
- **Delete:** Remove an application entry

### 4.3 Dashboard Stats
- Total applications
- Breakdown by status (count per enum value)
- Interview rate = (Interview + Offer count) / Total
- Optional: simple bar/pie chart of status distribution

### 4.4 Email Reminders
- Daily Vercel Cron job (e.g., `/api/cron/reminders`)
- Query: applications where `status = "Applied"` AND `lastUpdated` older than N days (e.g., 7)
- Send reminder email via Resend: "Follow up on your application to {company}"
- Mark as reminded (avoid duplicate emails — add `lastReminderSent` field)

---

## 5. API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler |
| `/api/applications` | GET | List user's applications (supports `?status=` filter) |
| `/api/applications` | POST | Create new application |
| `/api/applications/[id]` | PATCH | Update application (status, notes, etc.) |
| `/api/applications/[id]` | DELETE | Delete application |
| `/api/applications/stats` | GET | Aggregated stats for dashboard |
| `/api/cron/reminders` | GET | Cron-triggered reminder job (protected by secret header) |

---

## 6. Out of Scope (explicitly skip)

- Mobile app / React Native version
- Team/collaboration features (shared boards, multi-user)
- Resume parsing or AI features
- Social login providers beyond Google (keep auth simple)
- Real-time updates (no WebSockets needed)

---

## 7. Interview Talking Points to Prepare

1. **Session management:** JWT vs database sessions — JWT is stateless and scales better; trade-off is harder to invalidate before expiry.
2. **DB scaling:** Why `{ userId: 1 }` index matters — without it, every dashboard query does a full collection scan.
3. **Cron reliability:** Idempotency — how `lastReminderSent` prevents duplicate emails if the cron retries.
4. **Schema design:** Why status is an enum at the application layer (Mongoose schema validation) since MongoDB itself is schemaless.

---

## 8. Build Order

1. Scaffold Next.js app, connect MongoDB Atlas via Mongoose
2. Set up NextAuth with Google provider + MongoDB adapter
3. Build Application model + CRUD API routes
4. Build application form + list/dashboard UI
5. Add stats endpoint + dashboard summary cards
6. Integrate Resend + Vercel Cron for reminder emails
7. Polish: loading states, empty states, error handling

---

## 9. Resources

- NextAuth docs: https://next-auth.js.org/
- NextAuth MongoDB Adapter: https://authjs.dev/getting-started/adapters/mongodb
- Mongoose docs: https://mongoosejs.com/docs/
- Resend (free tier): https://resend.com/
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
