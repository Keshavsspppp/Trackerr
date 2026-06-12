import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';

const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is ValidStatus {
  return (
    typeof value === 'string' &&
    (VALID_STATUSES as readonly string[]).includes(value)
  );
}

// ---------------------------------------------------------------------------
// PATCH /api/applications/[id] — update an application
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const { id } = params;

    const body = await req.json();
    const { status, notes, jobUrl, appliedDate } = body;

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

    const updateFields: Record<string, unknown> = {
      lastUpdated: new Date(),
    };
    if (status !== undefined) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;
    if (jobUrl !== undefined) updateFields.jobUrl = jobUrl;
    if (appliedDate !== undefined) updateFields.appliedDate = appliedDate;

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
    console.error('[PATCH /api/applications/[id]]', err);
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
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const { id } = params;

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
    console.error('[DELETE /api/applications/[id]]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
