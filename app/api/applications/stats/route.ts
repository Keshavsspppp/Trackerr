import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';

export interface IApplicationStats {
  total: number;
  byStatus: {
    Applied: number;
    Interview: number;
    Offer: number;
    Rejected: number;
  };
  interviewRate: number; // (Interview + Offer) / total, or 0 if total === 0
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

    // Aggregation pipeline:
    // 1. $match — restrict to this user's documents
    // 2. $group — count documents per status
    // 3. $project — reshape into { status, count }
    const aggregation = await Application.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
    ]);

    // Build the byStatus map from the aggregation result
    const byStatus: IApplicationStats['byStatus'] = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };

    for (const entry of aggregation) {
      const status = entry.status as keyof typeof byStatus;
      if (status in byStatus) {
        byStatus[status] = entry.count as number;
      }
    }

    const total =
      byStatus.Applied + byStatus.Interview + byStatus.Offer + byStatus.Rejected;

    // Guard against division by zero (Requirement 6.4)
    const interviewRate =
      total === 0 ? 0 : (byStatus.Interview + byStatus.Offer) / total;

    const stats: IApplicationStats = {
      total,
      byStatus,
      interviewRate,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (err) {
    console.error('[GET /api/applications/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
