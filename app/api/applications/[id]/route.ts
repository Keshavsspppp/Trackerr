import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';
import { isValidStatus, type ValidStatus } from '@/src/lib/validation';
import { logError } from '@/src/lib/logger';

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

    const body = await req.json();
    const { status, notes, jobUrl, appliedDate, source, capturedAt, originalUrl } = body;

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

    // Validate source — must be one of the allowed values when provided
    if (source !== undefined && !['manual', 'extension', 'csv_import'].includes(source)) {
      return NextResponse.json(
        { error: 'source must be one of: manual, extension, csv_import' },
        { status: 400 }
      );
    }

    // Validate capturedAt — must parse to a real date when provided
    if (capturedAt !== undefined) {
      const parsed = new Date(capturedAt);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'capturedAt must be a valid date string' },
          { status: 400 }
        );
      }
    }

    // Validate originalUrl — must be a string when provided
    if (originalUrl !== undefined && typeof originalUrl !== 'string') {
      return NextResponse.json(
        { error: 'originalUrl must be a string' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateFields: Record<string, unknown> = {};
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
