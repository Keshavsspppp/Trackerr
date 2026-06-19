import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { Application } from "@/src/models/Application";
import type { IApplicationStats } from "@/app/api/applications/stats/route";
import type { IApplication } from "@/src/components/ApplicationList";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string | string[] | undefined }>;
}) {
  // 1. Verify the session — redirect to landing if unauthenticated
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect("/");
  }

  let applications: IApplication[] = [];
  let stats: IApplicationStats | undefined = undefined;
  let errorMsg = "";

  try {
    // 2. Connect to MongoDB and fetch data directly
    await connectDB();

    // Resolve limit from searchParams
    const resolvedParams = await searchParams;
    const limitParam = resolvedParams?.limit;
    let limit = 100;
    if (limitParam && typeof limitParam === 'string') {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed)) {
        limit = Math.max(1, parsed);
      }
    }

    // Fetch applications sorted by createdAt descending, limited by page/limit parameters
    const rawApplications = await Application.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Serialize Mongoose lean documents to plain objects that match IApplication
    applications = rawApplications.map((doc) => ({
      _id: String(doc._id),
      userId: doc.userId,
      company: doc.company,
      role: doc.role,
      status: doc.status as IApplication["status"],
      appliedDate: doc.appliedDate ? doc.appliedDate.toISOString() : undefined,
      jobUrl: doc.jobUrl ?? undefined,
      notes: doc.notes ?? undefined,
      source: (doc as any).source ?? undefined,
      lastUpdated: doc.lastUpdated
        ? doc.lastUpdated.toISOString()
        : new Date().toISOString(),
      createdAt: doc.createdAt
        ? doc.createdAt.toISOString()
        : new Date().toISOString(),
    }));

    // 3. Compute stats using the entire database (not just the paginated slice)
    const statsApps = await Application.find({ userId }, { status: 1, appliedDate: 1 }).lean();

    const byStatus: IApplicationStats["byStatus"] = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };

    for (const app of statsApps) {
      const s = app.status as keyof typeof byStatus;
      if (s in byStatus) {
        byStatus[s] += 1;
      }
    }

    const total =
      byStatus.Applied + byStatus.Interview + byStatus.Offer + byStatus.Rejected;

    const interviewRate =
      total === 0 ? 0 : (byStatus.Interview + byStatus.Offer) / total;

    // Compute 30-day trends
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30DaysApps = statsApps.filter(
      (app) => app.appliedDate && new Date(app.appliedDate) >= thirtyDaysAgo
    );
    const prior30DaysApps = statsApps.filter((app) => {
      if (!app.appliedDate) return false;
      const date = new Date(app.appliedDate);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const last30Stats = {
      total: last30DaysApps.length,
      Applied: last30DaysApps.filter((a) => a.status === 'Applied').length,
      Interview: last30DaysApps.filter((a) => a.status === 'Interview').length,
      Offer: last30DaysApps.filter((a) => a.status === 'Offer').length,
      Rejected: last30DaysApps.filter((a) => a.status === 'Rejected').length,
    };

    const prior30Stats = {
      total: prior30DaysApps.length,
      Applied: prior30DaysApps.filter((a) => a.status === 'Applied').length,
      Interview: prior30DaysApps.filter((a) => a.status === 'Interview').length,
      Offer: prior30DaysApps.filter((a) => a.status === 'Offer').length,
      Rejected: prior30DaysApps.filter((a) => a.status === 'Rejected').length,
    };

    const last30InterviewRate =
      last30Stats.total === 0
        ? 0
        : (last30Stats.Interview + last30Stats.Offer) / last30Stats.total;

    const prior30InterviewRate =
      prior30Stats.total === 0
        ? 0
        : (prior30Stats.Interview + prior30Stats.Offer) / prior30Stats.total;

    const trends = {
      totalDelta: last30Stats.total - prior30Stats.total,
      appliedDelta: last30Stats.Applied - prior30Stats.Applied,
      interviewDelta: last30Stats.Interview - prior30Stats.Interview,
      offerDelta: last30Stats.Offer - prior30Stats.Offer,
      rejectedDelta: last30Stats.Rejected - prior30Stats.Rejected,
      interviewRateDelta: last30InterviewRate - prior30InterviewRate,
    };

    stats = {
      total,
      byStatus,
      interviewRate,
      trends,
    };
  } catch (err) {
    console.error("Dashboard database fetch error:", err);
    errorMsg = "We encountered an issue connecting to the database or loading your applications. Please try again in a few moments.";
  }

  // 4. Render — pass serialized data to the Client Component
  return <DashboardClient applications={applications} stats={stats} errorMsg={errorMsg} />;
}
