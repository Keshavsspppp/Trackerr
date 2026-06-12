import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';

const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is ValidStatus {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// POST /api/applications — create a new application
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const body = await req.json();
    const { company, role, status, appliedDate, jobUrl, notes } = body;

    // Validate required fields — must be non-empty and non-whitespace
    if (!company || typeof company !== 'string' || !company.trim()) {
      return NextResponse.json(
        { error: 'company and role are required' },
        { status: 400 }
      );
    }
    if (!role || typeof role !== 'string' || !role.trim()) {
      return NextResponse.json(
        { error: 'company and role are required' },
        { status: 400 }
      );
    }

    // Validate optional status field
    if (status !== undefined && !isValidStatus(status)) {
      return NextResponse.json(
        {
          error:
            'Invalid status value. Must be one of: Applied, Interview, Offer, Rejected',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await Application.create({
      userId,
      company: company.trim(),
      role: role.trim(),
      ...(status !== undefined ? { status } : {}),
      ...(appliedDate !== undefined ? { appliedDate } : {}),
      ...(jobUrl !== undefined ? { jobUrl } : {}),
      ...(notes !== undefined ? { notes } : {}),
      lastUpdated: new Date(),
    });

    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    console.error('[POST /api/applications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/applications — list applications for the authenticated user
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get('status');

    // Validate optional status filter
    if (statusParam !== null && !isValidStatus(statusParam)) {
      return NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    await connectDB();

    const query: { userId: string; status?: ValidStatus } = { userId };
    if (statusParam !== null) {
      query.status = statusParam as ValidStatus;
    }

    const applications = await Application.find(query).sort({ createdAt: -1 });

    return NextResponse.json(applications, { status: 200 });
  } catch (err) {
    console.error('[GET /api/applications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
