# 📋 Trackerr

### A premium, full-stack internship application tracker built for students to organize, analyze, and optimize their internship hunt.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-50%20passing-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-running-tests">Testing</a> •
  <a href="#-api-reference">API Docs</a>
</p>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKeshavsspppp%2FTrackerr)

</div>

---

## ✨ Overview

Applying for internships can feel like a full-time job. With hundreds of applications across different platforms, tracking deadlines, follow-ups, and interviews is overwhelming.

**Trackerr** solves this. It's a production-ready, feature-rich web application designed specifically for students and active seekers. Log applications, visualize your progress with interactive **Kanban boards**, analyze your application velocity, view your conversion rate with a **funnel chart**, and receive automated **daily email reminders** when applications have gone cold — all behind secure Google authentication.

---

## 🎯 Why Trackerr?

Unlike generic trackers, Trackerr is built specifically for the **internship** lifecycle:
* **No Password Fatigue:** Log in securely with one click using your Google Account.
* **Visualize the Pipeline:** Switch between a Kanban board for stage-based management and a filterable list view for detailed tracking.
* **Never Miss a Follow-up:** Receive daily emails for applications that haven't been updated in 7+ days.
* **Understand the Funnel:** See exactly where your pipeline bottlenecks are with a dynamic conversion funnel chart (Applied ➔ Interviewing ➔ Offer).
* **Data Portability:** Bring your own data with our robust CSV import/export utility.

---

## 🚀 Key Features

* 🔐 **Secure Google Auth & JWT:** Zero passwords. Powered by NextAuth.js and stateless, lightweight JWT sessions for speed.
* 📋 **Double Views (Kanban & List):**
  * **Kanban Board:** Drag and drop cards to change status (Applied, Interviewing, Offer, Rejected).
  * **List Table:** Clean table with search, status filtering, and quick actions.
* 📊 **Analytics Dashboard:**
  * **Funnel Chart:** Displays tapering bars showing the conversion flow from application to interview to offer, along with a calculated overall offer rate.
  * **Velocity Chart:** Visualizes weekly/monthly application rates to help you maintain momentum.
  * **Status Counters:** Quick cards showing active numbers in each stage.
* 📬 **Daily Email Reminders:** Integrates Vercel Cron and Resend to send you a digest of internship applications that have gone stale (no updates in 7+ days).
* 📤 **CSV Import & Export:** Bulk import applications using a template CSV (includes automatic rate-limit throttling and validation logic). Export to standard CSV.
* 🧪 **Property-Based Testing:** Over 50 robust tests across 7 files powered by Vitest and fast-check, verifying everything from the React UI to the rate limiter.

---

## 🛠 Tech Stack

| Category | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) | App Router, API Routes, & Server Actions |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type-safety across client and server |
| **Styling** | Vanilla CSS / CSS Variables | Modern, clean UI with interactive animations |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) | Google Provider + stateless JWT session tokens |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Mongoose schemas for application and user structures |
| **Email** | [Resend](https://resend.com/) | Transactional email delivery service |
| **Task Runner** | [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) | Scheduled daily reminder trigger |
| **Testing** | [Vitest](https://vitest.dev/) & [fast-check](https://fast-check.io/) | Fast unit testing and generative property-based testing |
| **Hosting** | [Vercel](https://vercel.com/) | Optimized Next.js serverless hosting |

---

## 📁 Project Structure

```
Trackerr/
├── app/
│   ├── layout.tsx                  # Root layout with Theme and SessionProvider
│   ├── page.tsx                    # Landing / Google Sign-In gate
│   ├── dashboard/
│   │   ├── page.tsx                # Server Component — fetches initial user applications
│   │   └── DashboardClient.tsx     # Client Component — manages state, views, and analytics
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler with MongoDB Adapter config
│       ├── applications/           # REST endpoints: GET (all/filtered), POST, PATCH, DELETE
│       │   └── stats/              # GET aggregated analytics for charts & stat cards
│       └── cron/reminders/         # Secure endpoint triggered by daily cron job
├── src/
│   ├── components/                 # Reusable UI Components
│   │   ├── KanbanBoard.tsx         # Drag-and-drop workflow visualizer
│   │   ├── ApplicationList.tsx     # Tabular view with filters, sorting, and pagination
│   │   ├── ApplicationForm.tsx     # Sliding form for adding/editing internships
│   │   ├── FunnelChart.tsx         # Stage conversion rates and offer funnel
│   │   ├── VelocityChart.tsx       # Weekly/monthly speed tracking chart
│   │   └── CSVImporter.tsx         # CSV parser with verification and chunk-based import
│   ├── lib/                        # dbConnect helper & custom auth wrappers
│   ├── models/                     # Application Mongoose schemas
│   └── proxy.ts                    # Next.js authentication/routing protection (proxy convention)
├── public/
│   └── demo-applications.csv       # Pre-built template for importing mock data
├── vercel.json                     # Cron schedule definition (daily 09:00 UTC)
├── .env.example                    # Template for environment variables
└── vitest.config.ts                # Testing configuration
```

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have:
* **Node.js** 18 or newer
* A **MongoDB Atlas** database connection string
* A **Google Cloud** project (for Google Login client ID & secret)
* A **Resend** account for sending email notifications

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/Keshavsspppp/Trackerr.git
cd Trackerr

# 2. Install dependencies
npm install

# 3. Create .env file from template
cp .env.example .env

# 4. Start the development server
npm run dev
```

### Running with Docker

You can easily run this application using Docker, which is optimized with a Next.js standalone multi-stage build.

```bash
# 1. Build the Docker image
docker build -t trackerr-app .

# 2. Run the Docker container
# Make sure your .env file is populated with the required environment variables
docker run -p 3000:3000 --env-file .env trackerr-app
```

Then visit `http://localhost:3000` in your browser.

### Environment Variables Config

Fill out the following variables in your `.env` file:

| Variable | Description | Example / Instructions |
|---|---|---|
| `MONGODB_URI` | MongoDB Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `NEXTAUTH_SECRET` | Secret for signing session cookies | Generate via: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` (for local development) |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud | `123456-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| OAuth Client Secret from Google Cloud | `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `RESEND_API_KEY` | Resend API Key | `re_1234567890` |
| `RESEND_FROM_EMAIL` | Verified sender address in Resend | `noreply@yourdomain.com` or `onboarding@resend.dev` |
| `CRON_SECRET` | Secret key to protect the cron route | Random key. Generate with: `openssl rand -base64 32` |

### Setting Up Google OAuth
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Create an **OAuth client ID** (Application type: **Web application**).
4. Set **Authorized JavaScript origins** to `http://localhost:3000`.
5. Set **Authorized redirect URIs** to `http://localhost:3000/api/auth/callback/google`.
6. Copy the generated Client ID and Client Secret into `.env`.

---

## 💡 Using the Demo CSV

A demo dataset is available at [`public/demo-applications.csv`](public/demo-applications.csv) containing 15 mock internship entries (Applied, Interviewing, Offer, Rejected) with various application dates and sources (LinkedIn, Glassdoor, Direct, Referral).

To load it:
1. Launch Trackerr and sign in.
2. Click **Import CSV** in the header.
3. Select `public/demo-applications.csv`.
4. Click **Import**. Trackerr will process, validate, and upload your applications in batches.

---

## 🧪 Running Tests

The project is backed by a suite of **50+ property-based and unit tests** to ensure data integrity, route protection, and stable form validation.

```bash
# Run all tests once
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Generate code coverage report
npm run test:coverage
```

Our testing utilizes **property-based testing** via [fast-check](https://fast-check.io/) to fuzz input states on our application controllers and utilities to uncover edge-case bugs before they happen.

---

## 🚢 Production Deployment

### 1. Vercel Deployment
Deploying to Vercel is seamless:
1. Push your code to GitHub.
2. Link your repository in [Vercel](https://vercel.com).
3. Set your production environment variables.
4. Update your Google Cloud OAuth redirect URI to include your Vercel deployment URL:
   `https://your-domain.vercel.app/api/auth/callback/google`
5. Change `NEXTAUTH_URL` in Vercel to your live domain: `https://your-domain.vercel.app`.

> [!WARNING]
> **MongoDB Network Access Whitelist**: While developing locally, allowing all IPs (`0.0.0.0/0`) is common practice. In production, however, lock down your MongoDB Atlas network access to only accept connections from Vercel's IP ranges (or utilize Vercel's official MongoDB integration/peer connections) to prevent brute-force database attacks.

### 2. Scheduled Cron Job
The daily cron job configuration is defined in `vercel.json` and runs automatically every day at 09:00 UTC.

To manually invoke it or test it from your local terminal:
```bash
curl -X GET https://your-domain.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📖 API Documentation

| Method | Endpoint | Description | Headers / Auth |
|---|---|---|---|
| `GET` | `/api/applications` | Retrieve current user's applications | NextAuth Session Cookie |
| `POST` | `/api/applications` | Create a new internship application | NextAuth Session Cookie |
| `PATCH` | `/api/applications` | Update an existing application | NextAuth Session Cookie |
| `DELETE` | `/api/applications` | Delete an application by ID | NextAuth Session Cookie |
| `GET` | `/api/applications/stats` | Aggregated statistics & conversion calculations | NextAuth Session Cookie |
| `GET` | `/api/cron/reminders` | Query database for stale entries and send email reminders | `Authorization: Bearer <CRON_SECRET>` |

---

## 🤝 Contributing

We welcome contributions to Trackerr! Here is how to get started:

1. **Fork** the repository.
2. **Create a branch** for your features: `git checkout -b feature/awesome-feature`.
3. **Commit** your changes following semantic guidelines: `git commit -m "feat: add support for application deadlines"`.
4. Ensure all unit and property-based tests pass: `npm test`.
5. **Push** to your fork and submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
Built with ❤️ by <a href="https://github.com/Keshavsspppp">Keshavsspppp</a>
</div>