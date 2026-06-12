import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/mongodb";
import { Application } from "@/src/models/Application";
import type { IApplicationStats } from "@/app/api/applications/stats/route";
import type { IApplication } from "@/src/components/ApplicationList";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // 1. Verify the session — redirect to landing if unauthenticated
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect("/");
  }

  // 2. Connect to MongoDB and fetch data directly (same process, no HTTP round-trip)
  await connectDB();

  // Fetch applications sorted by createdAt descending
  const rawApplications = await Application.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  // Serialize Mongoose lean documents to plain objects that match IApplication
  const applications: IApplication[] = rawApplications.map((doc) => ({
    _id: String(doc._id),
    userId: doc.userId,
    company: doc.company,
    role: doc.role,
    status: doc.status as IApplication["status"],
    appliedDate: doc.appliedDate ? doc.appliedDate.toISOString() : undefined,
    jobUrl: doc.jobUrl ?? undefined,
    notes: doc.notes ?? undefined,
    lastUpdated: doc.lastUpdated
      ? doc.lastUpdated.toISOString()
      : new Date().toISOString(),
    createdAt: doc.createdAt
      ? doc.createdAt.toISOString()
      : new Date().toISOString(),
  }));

  // 3. Compute stats using the same logic as GET /api/applications/stats
  const byStatus: IApplicationStats["byStatus"] = {
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  };

  for (const app of applications) {
    const s = app.status;
    if (s in byStatus) {
      byStatus[s] += 1;
    }
  }

  const total =
    byStatus.Applied + byStatus.Interview + byStatus.Offer + byStatus.Rejected;

  const interviewRate =
    total === 0 ? 0 : (byStatus.Interview + byStatus.Offer) / total;

  const stats: IApplicationStats = {
    total,
    byStatus,
    interviewRate,
  };

  // 4. Render — pass serialized data to the Client Component
  return <DashboardClient applications={applications} stats={stats} />;
}
