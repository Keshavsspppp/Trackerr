<div align="center">

# 📋 Trackerr

### A full-stack job application tracker — from first apply to offer or rejection.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-50%20passing-brightgreen?logo=vitest)](https://vitest.dev/)

</div>

---

## ✨ Overview

Trackerr is a personal, full-stack web application that helps job seekers stay organized during their job hunt. Sign in with Google, log applications, track their status through the hiring funnel, and get daily email reminders about applications that need a follow-up — all in one clean dashboard.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 **Google OAuth** | One-click sign-in via NextAuth.js — zero passwords |
| 📝 **Full CRUD** | Add, update, delete, and filter job applications |
| 📊 **Dashboard Stats** | At-a-glance totals: applied, interviewing, offers, rejections, interview rate |
| 🔎 **Status Filtering** | Instantly filter by Applied / Interview / Offer / Rejected |
| 📬 **Daily Email Reminders** | Vercel Cron + Resend pings you when an application has gone stale (7+ days, no update) |
| 🔒 **JWT Sessions** | Stateless authentication — scales horizontally without per-request DB hits |
| ✅ **Property-Based Tests** | 50 tests across 7 files using Vitest + fast-check |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) — App Router + TypeScript |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) + Google OAuth 2.0 |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) via Mongoose |
| **Email** | [Resend](https://resend.com/) |
| **Scheduling** | [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) |
| **Testing** | [Vitest](https://vitest.dev/) + [fast-check](https://fast-check.io/) |
| **Hosting** | [Vercel](https://vercel.com/) |

---

## 📁 Project Structure

```
Trackerr/
├── app/
│   ├── layout.tsx                  # Root layout with SessionProvider
│   ├── page.tsx                    # Landing / sign-in page
│   ├── dashboard/
│   │   ├── page.tsx                # Server Component — fetches data from DB
│   │   └── DashboardClient.tsx     # Client Component — filter state + refresh
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       ├── applications/           # GET, POST, PATCH, DELETE
│       ├── applications/stats/     # GET aggregated stats
│       └── cron/reminders/         # Daily stale-application reminder job
├── src/
│   ├── components/                 # ApplicationForm, ApplicationList, StatsCards, StatusFilter
│   ├── lib/                        # mongodb.ts, auth.ts (NextAuth config)
│   └── models/                     # Application Mongoose schema
├── proxy.ts                        # Auth middleware (Next.js 16)
├── vercel.json                     # Cron schedule (daily 09:00 UTC)
├── .env.example                    # Environment variable template
└── vitest.config.ts                # Test configuration
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster
- A [Google Cloud](https://console.cloud.google.com/) project with OAuth 2.0 credentials
- A [Resend](https://resend.com/) account (free tier is enough)

### 1. Clone the repository

```bash
git clone https://github.com/Keshavsspppp/Trackerr.git
cd Trackerr
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the following:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Atlas connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/trackerr` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → Credentials |
| `RESEND_API_KEY` | From your Resend dashboard |
| `CRON_SECRET` | Random secret to protect the cron endpoint — `openssl rand -base64 32` |

### 4. Set up Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID** (Web application)
2. Add **Authorized JavaScript origins:** `http://localhost:3000`
3. Add **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

### 5. Whitelist your IP in MongoDB Atlas

**Network Access → Add IP Address → Add Current IP Address** (or use `0.0.0.0/0` for development)

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

---

## 🧪 Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

The test suite includes **50 tests across 7 files** — unit tests and property-based tests powered by fast-check.

---

## 🚢 Deploying to Vercel

1. Push the repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from the table above under **Settings → Environment Variables**.
4. Add the production redirect URI in Google Cloud Console:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
5. Update `NEXTAUTH_URL` to `https://your-app.vercel.app` in Vercel env vars.
6. Deploy — the daily email cron runs automatically at **09:00 UTC**.

### Manually trigger the cron job

```bash
curl -X GET https://your-app.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📖 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications` | List all applications for the signed-in user |
| `POST` | `/api/applications` | Create a new application |
| `PATCH` | `/api/applications` | Update an existing application |
| `DELETE` | `/api/applications` | Delete an application |
| `GET` | `/api/applications/stats` | Get aggregated dashboard stats |
| `GET` | `/api/cron/reminders` | Trigger daily reminder emails (cron-protected) |

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

Please make sure all tests pass before submitting a PR.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ by [Keshavsspppp](https://github.com/Keshavsspppp)

</div>
