import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';
import { isValidStatus, type ValidStatus, createApplicationSchema } from '@/src/lib/validation';
import { logError } from '@/src/lib/logger';
import { checkRateLimit } from '@/src/lib/rateLimit';

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
    const userEmail = token.email as string | undefined;

    const body = await req.json();
    const result = createApplicationSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { company, role, status, appliedDate, jobUrl, notes, source, capturedAt, originalUrl } = result.data;

    // CSV bulk imports get a higher rate-limit cap (100/min) so that importing
    // a full spreadsheet never returns 429. Manual/extension adds keep the
    // stricter 10/min cap to prevent abuse.
    const isCsvImport = source === 'csv_import';
    const limit = isCsvImport ? 100 : 10;
    const keyPrefix = isCsvImport ? 'csv' : '';
    const rateLimitResult = checkRateLimit(userId, limit, keyPrefix);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter ?? 60),
          },
        }
      );
    }

    // Reject if email is missing — required for reminder emails
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not available in session' },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await Application.create({
      userId,
      userEmail, // Store email directly to avoid cross-collection lookups in cron
      company: company.trim(),
      role: role.trim(),
      ...(status !== undefined ? { status } : {}),
      ...(appliedDate !== undefined ? { appliedDate: new Date(appliedDate) } : {}),
      ...(jobUrl !== undefined ? { jobUrl } : {}),
      ...(notes !== undefined ? { notes } : {}),
      source: source || 'manual', // Default to 'manual' when not provided
      ...(capturedAt !== undefined ? { capturedAt: new Date(capturedAt) } : {}),
      ...(originalUrl !== undefined ? { originalUrl } : {}),
      lastUpdated: new Date(),
    });

    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    logError('[POST /api/applications]', err);
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
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // Validate optional status filter
    if (statusParam !== null && !isValidStatus(statusParam)) {
      return NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    // Parse pagination params with defaults
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50;
    const skip = (page - 1) * limit;

    await connectDB();

    const query: { userId: string; status?: ValidStatus } = { userId };
    if (statusParam !== null) {
      query.status = statusParam as ValidStatus;
    }

    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return NextResponse.json(applications, { status: 200 });
  } catch (err) {
    logError('[GET /api/applications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
