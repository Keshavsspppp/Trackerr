import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';
import { isValidStatus, type ValidStatus } from '@/src/lib/validation';
import { logError } from '@/src/lib/logger';

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter for POST requests
// ---------------------------------------------------------------------------
export const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 applications per minute

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // First request or window expired — reset
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  userLimit.count++;
  return { allowed: true };
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
    const userEmail = token.email as string | undefined;

    // Rate limit check
    const rateLimitResult = checkRateLimit(userId);
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

    // Validate jobUrl — must be a string when provided
    if (jobUrl !== undefined && typeof jobUrl !== 'string') {
      return NextResponse.json(
        { error: 'jobUrl must be a string' },
        { status: 400 }
      );
    }

    // Validate appliedDate — must parse to a real date when provided
    if (appliedDate !== undefined) {
      const parsed = new Date(appliedDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'appliedDate must be a valid date string' },
          { status: 400 }
        );
      }
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
