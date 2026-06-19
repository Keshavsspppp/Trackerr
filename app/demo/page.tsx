import type { IApplication } from "@/src/components/ApplicationList";
import type { IApplicationStats } from "@/app/api/applications/stats/route";
import DashboardClient from "../dashboard/DashboardClient";

const DEMO_APPLICATIONS: IApplication[] = [
  {
    _id: "demo-1",
    userId: "demo",
    company: "Google",
    role: "Software Engineering Intern",
    status: "Interview",
    appliedDate: "2026-06-01T00:00:00.000Z",
    jobUrl: "https://careers.google.com/jobs/results/",
    notes: "Passed phone screen. Technical interview scheduled for next week.",
    source: "csv_import",
    lastUpdated: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z"
  },
  {
    _id: "demo-2",
    userId: "demo",
    company: "Meta",
    role: "Frontend Engineering Intern",
    status: "Applied",
    appliedDate: "2026-06-03T00:00:00.000Z",
    jobUrl: "https://www.metacareers.com/",
    notes: "Applied via university referral program.",
    source: "csv_import",
    lastUpdated: "2026-06-03T00:00:00.000Z",
    createdAt: "2026-06-03T00:00:00.000Z"
  },
  {
    _id: "demo-3",
    userId: "demo",
    company: "Stripe",
    role: "Full Stack Engineering Intern",
    status: "Offer",
    appliedDate: "2026-05-20T00:00:00.000Z",
    jobUrl: "https://stripe.com/jobs",
    notes: "Received offer — $8500/month stipend, 12-week summer term.",
    source: "csv_import",
    lastUpdated: "2026-05-20T00:00:00.000Z",
    createdAt: "2026-05-20T00:00:00.000Z"
  },
  {
    _id: "demo-4",
    userId: "demo",
    company: "Amazon",
    role: "SDE Intern",
    status: "Rejected",
    appliedDate: "2026-05-15T00:00:00.000Z",
    jobUrl: "https://www.amazon.jobs/",
    notes: "Rejected after OA round. Will reapply next cycle.",
    source: "csv_import",
    lastUpdated: "2026-05-15T00:00:00.000Z",
    createdAt: "2026-05-15T00:00:00.000Z"
  },
  {
    _id: "demo-5",
    userId: "demo",
    company: "Airbnb",
    role: "iOS Engineering Intern",
    status: "Applied",
    appliedDate: "2026-06-10T00:00:00.000Z",
    jobUrl: "https://careers.airbnb.com/",
    notes: "Submitted via campus portal. Awaiting recruiter screen.",
    source: "csv_import",
    lastUpdated: "2026-06-10T00:00:00.000Z",
    createdAt: "2026-06-10T00:00:00.000Z"
  },
  {
    _id: "demo-6",
    userId: "demo",
    company: "Netflix",
    role: "Data Engineering Intern",
    status: "Interview",
    appliedDate: "2026-05-28T00:00:00.000Z",
    jobUrl: "https://jobs.netflix.com/",
    notes: "Two technical rounds done, hiring manager chat pending.",
    source: "csv_import",
    lastUpdated: "2026-05-28T00:00:00.000Z",
    createdAt: "2026-05-28T00:00:00.000Z"
  },
  {
    _id: "demo-7",
    userId: "demo",
    company: "Shopify",
    role: "Backend Engineering Intern",
    status: "Applied",
    appliedDate: "2026-06-12T00:00:00.000Z",
    jobUrl: "https://www.shopify.com/careers",
    notes: "Applied through LinkedIn. No response yet.",
    source: "csv_import",
    lastUpdated: "2026-06-12T00:00:00.000Z",
    createdAt: "2026-06-12T00:00:00.000Z"
  },
  {
    _id: "demo-8",
    userId: "demo",
    company: "Microsoft",
    role: "Software Engineering Intern",
    status: "Interview",
    appliedDate: "2026-06-05T00:00:00.000Z",
    jobUrl: "https://careers.microsoft.com/",
    notes: "Completed coding assessment. Team-match call this week.",
    source: "csv_import",
    lastUpdated: "2026-06-05T00:00:00.000Z",
    createdAt: "2026-06-05T00:00:00.000Z"
  },
  {
    _id: "demo-9",
    userId: "demo",
    company: "Apple",
    role: "Machine Learning Intern",
    status: "Rejected",
    appliedDate: "2026-05-10T00:00:00.000Z",
    jobUrl: "https://jobs.apple.com/",
    notes: "Did not pass initial resume screen. Improving ML projects first.",
    source: "csv_import",
    lastUpdated: "2026-05-10T00:00:00.000Z",
    createdAt: "2026-05-10T00:00:00.000Z"
  },
  {
    _id: "demo-10",
    userId: "demo",
    company: "Notion",
    role: "Product Engineering Intern",
    status: "Applied",
    appliedDate: "2026-06-14T00:00:00.000Z",
    jobUrl: "https://www.notion.so/careers",
    notes: "Small team, exciting stack. Dream internship.",
    source: "csv_import",
    lastUpdated: "2026-06-14T00:00:00.000Z",
    createdAt: "2026-06-14T00:00:00.000Z"
  },
  {
    _id: "demo-11",
    userId: "demo",
    company: "Figma",
    role: "Frontend Engineering Intern",
    status: "Interview",
    appliedDate: "2026-06-08T00:00:00.000Z",
    jobUrl: "https://www.figma.com/careers/",
    notes: "First round done, design system deep-dive scheduled.",
    source: "csv_import",
    lastUpdated: "2026-06-08T00:00:00.000Z",
    createdAt: "2026-06-08T00:00:00.000Z"
  },
  {
    _id: "demo-12",
    userId: "demo",
    company: "Vercel",
    role: "Developer Experience Intern",
    status: "Applied",
    appliedDate: "2026-06-16T00:00:00.000Z",
    jobUrl: "https://vercel.com/careers",
    notes: "Applied cold via email to recruiter.",
    source: "csv_import",
    lastUpdated: "2026-06-16T00:00:00.000Z",
    createdAt: "2026-06-16T00:00:00.000Z"
  },
  {
    _id: "demo-13",
    userId: "demo",
    company: "Linear",
    role: "Full Stack Engineering Intern",
    status: "Applied",
    appliedDate: "2026-06-17T00:00:00.000Z",
    jobUrl: "https://linear.app/careers",
    notes: "Love the product — applied through their site.",
    source: "csv_import",
    lastUpdated: "2026-06-17T00:00:00.000Z",
    createdAt: "2026-06-17T00:00:00.000Z"
  },
  {
    _id: "demo-14",
    userId: "demo",
    company: "Spotify",
    role: "Web Engineering Intern",
    status: "Rejected",
    appliedDate: "2026-05-25T00:00:00.000Z",
    jobUrl: "https://www.lifeatspotify.com/",
    notes: "Rejected at screening — timezone mismatch with the team.",
    source: "csv_import",
    lastUpdated: "2026-05-25T00:00:00.000Z",
    createdAt: "2026-05-25T00:00:00.000Z"
  },
  {
    _id: "demo-15",
    userId: "demo",
    company: "GitHub",
    role: "Open Source Engineering Intern",
    status: "Interview",
    appliedDate: "2026-06-02T00:00:00.000Z",
    jobUrl: "https://github.com/about/careers",
    notes: "Strong fit with open source background, final round this week.",
    source: "csv_import",
    lastUpdated: "2026-06-02T00:00:00.000Z",
    createdAt: "2026-06-02T00:00:00.000Z"
  }
];

export default function DemoPage() {
  const byStatus = {
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0
  };

  for (const app of DEMO_APPLICATIONS) {
    byStatus[app.status] += 1;
  }

  const total = DEMO_APPLICATIONS.length;
  const interviewRate = total === 0 ? 0 : (byStatus.Interview + byStatus.Offer) / total;

  const trends = {
    totalDelta: 4,
    appliedDelta: 2,
    interviewDelta: 1,
    offerDelta: 1,
    rejectedDelta: 0,
    interviewRateDelta: 0.05
  };

  const stats: IApplicationStats = {
    total,
    byStatus,
    interviewRate,
    trends
  };

  return (
    <DashboardClient
      applications={DEMO_APPLICATIONS}
      stats={stats}
      isDemo={true}
    />
  );
}
