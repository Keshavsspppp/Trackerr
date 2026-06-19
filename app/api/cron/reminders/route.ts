// Feature: job-application-tracker — Cron reminder route
// GET /api/cron/reminders
//
// Protected by Authorization: Bearer <CRON_SECRET> header.
// Queries stale applications and sends reminder emails via Resend.
// Returns { processed, sent, errors } with HTTP 200.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { Resend } from 'resend';
import { connectDB } from '@/src/lib/mongodb';
import { Application } from '@/src/models/Application';
import { logError } from '@/src/lib/logger';
import { isStaleApplication } from '@/src/lib/applicationUtils';

/**
 * Timing-safe string comparison — prevents timing attacks on the CRON_SECRET.
 * Pads/truncates both sides to the same byte length before comparing so that
 * `timingSafeEqual` (which requires equal-length buffers) never throws.
 * 
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if the strings are equal, false otherwise
 */
function safeCompare(a: string, b: string): boolean {
  const len = Math.max(Buffer.byteLength(a), Buffer.byteLength(b));
  const bufA = Buffer.alloc(len);
  const bufB = Buffer.alloc(len);
  bufA.write(a);
  bufB.write(b);
  return timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Auth guard: validate CRON_SECRET with a timing-safe comparison
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  // Reject immediately if either side is missing (timingSafeEqual requires strings)
  if (!authHeader || !expectedToken || !safeCompare(authHeader, `Bearer ${expectedToken}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now = new Date();
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Query stale applications
    const staleApps = await Application.find({
      status: 'Applied',
      lastUpdated: { $lt: cutoff },
      $or: [
        { lastReminderSent: null },
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: { $lt: cutoff } },
      ],
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    let sent = 0;
    let errors = 0;

    for (const app of staleApps) {
      try {
        // Use the denormalized userEmail field directly — no cross-collection lookup needed
        if (!app.userEmail) {
          console.warn(
            `[cron/reminders] No email stored for app=${app._id}, skipping`
          );
          errors++;
          continue;
        }

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@jobtracker.app',
          to: app.userEmail,
          subject: 'Follow up on your application',
          html: `<p>Don't forget to follow up on your application for <strong>${app.role}</strong> at <strong>${app.company}</strong>.</p>`,
        });

        // Update lastReminderSent only on success
        await Application.findByIdAndUpdate(app._id, {
          $set: { lastReminderSent: new Date() },
        });

        sent++;
      } catch (err) {
        console.error(`[cron/reminders] Error processing app=${app._id}:`, err);
        errors++;
      }
    }

    return NextResponse.json(
      { processed: staleApps.length, sent, errors },
      { status: 200 }
    );
  } catch (err) {
    logError('[GET /api/cron/reminders]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
