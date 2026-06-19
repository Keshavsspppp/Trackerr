import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';
import { logError } from '@/src/lib/logger';

export interface IApplicationStats {
  total: number;
  byStatus: {
    Applied: number;
    Interview: number;
    Offer: number;
    Rejected: number;
  };
  interviewRate: number; // (Interview + Offer) / total, or 0 if total === 0
  trends?: {
    totalDelta: number;
    appliedDelta: number;
    interviewDelta: number;
    offerDelta: number;
    rejectedDelta: number;
    interviewRateDelta: number;
  };
}

// ---------------------------------------------------------------------------
// GET /api/applications/stats — return aggregated statistics for the user
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;

    await connectDB();

    // Fetch all user's applications to calculate trends in-memory
    const rawApplications = await Application.find({ userId }).lean();

    const byStatus: IApplicationStats['byStatus'] = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };

    for (const app of rawApplications) {
      const status = app.status as keyof typeof byStatus;
      if (status in byStatus) {
        byStatus[status] += 1;
      }
    }

    const total =
      byStatus.Applied + byStatus.Interview + byStatus.Offer + byStatus.Rejected;

    // Guard against division by zero (Requirement 6.4)
    const interviewRate =
      total === 0 ? 0 : (byStatus.Interview + byStatus.Offer) / total;

    // Compute 30-day trends
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30DaysApps = rawApplications.filter(
      (app) => app.appliedDate && new Date(app.appliedDate) >= thirtyDaysAgo
    );
    const prior30DaysApps = rawApplications.filter((app) => {
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

    const stats: IApplicationStats = {
      total,
      byStatus,
      interviewRate,
      trends,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (err) {
    logError('[GET /api/applications/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
