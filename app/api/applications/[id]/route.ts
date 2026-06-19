import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';
import { isValidStatus, type ValidStatus, updateApplicationSchema } from '@/src/lib/validation';
import { logError } from '@/src/lib/logger';
import { checkRateLimit } from '@/src/lib/rateLimit';

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id] — update an application
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const { id } = await params;

    // Reject malformed ObjectIds before hitting Mongoose — avoids a CastError → 500
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid application id' }, { status: 400 });
    }

    // Rate Limiting
    const rateLimitResult = checkRateLimit(userId, 20, 'modify');
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
    const result = updateApplicationSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { company, role, status, notes, jobUrl, appliedDate, source, capturedAt, originalUrl } = result.data;

    await connectDB();

    const updateFields: Record<string, unknown> = {};
    if (company !== undefined) updateFields.company = company.trim();
    if (role !== undefined) updateFields.role = role.trim();
    if (status !== undefined) {
      updateFields.status = status;
      // Only reset the staleness clock when the user actually changes status
      updateFields.lastUpdated = new Date();
    }
    if (notes !== undefined) updateFields.notes = notes;
    if (jobUrl !== undefined) updateFields.jobUrl = jobUrl;
    if (appliedDate !== undefined) updateFields.appliedDate = new Date(appliedDate);
    if (source !== undefined) updateFields.source = source;
    if (capturedAt !== undefined) updateFields.capturedAt = new Date(capturedAt);
    if (originalUrl !== undefined) updateFields.originalUrl = originalUrl;

    const updated = await Application.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    logError('[PATCH /api/applications/[id]]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/applications/[id] — delete an application
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const { id } = await params;

    // Reject malformed ObjectIds before hitting Mongoose
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid application id' }, { status: 400 });
    }

    // Rate Limiting
    const rateLimitResult = checkRateLimit(userId, 20, 'modify');
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

    await connectDB();

    const deleted = await Application.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (err) {
    logError('[DELETE /api/applications/[id]]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
