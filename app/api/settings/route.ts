import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/src/lib/mongodb';
import { UserSettings } from '@/src/models/UserSettings';
import { logError } from '@/src/lib/logger';
import { checkRateLimit } from '@/src/lib/rateLimit';

// GET /api/settings - Fetch user settings
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;

    await connectDB();

    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      // Return default values if settings don't exist in DB yet
      return NextResponse.json({ staleThresholdDays: 14 }, { status: 200 });
    }

    return NextResponse.json({ staleThresholdDays: settings.staleThresholdDays }, { status: 200 });
  } catch (err) {
    logError('[GET /api/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings - Create or update user settings
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;

    // Rate Limiting
    const rateLimitResult = await checkRateLimit(userId, 20, 'modify');
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

    const body = await req.json();
    const staleThresholdDays = parseInt(body.staleThresholdDays, 10);

    if (isNaN(staleThresholdDays) || staleThresholdDays < 1 || staleThresholdDays > 365) {
      return NextResponse.json({ error: 'Stale threshold must be a number between 1 and 365' }, { status: 400 });
    }

    await connectDB();

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: { staleThresholdDays } },
      { upsert: true, new: true, returnDocument: 'after' }
    );

    return NextResponse.json({ staleThresholdDays: settings.staleThresholdDays }, { status: 200 });
  } catch (err) {
    logError('[POST /api/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
