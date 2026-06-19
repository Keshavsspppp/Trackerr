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
import { UserSettings } from '@/src/models/UserSettings';

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

  // Safeguard: reject immediately if CRON_SECRET is not configured or is too short (enforced outside tests)
  if (process.env.NODE_ENV !== 'test' && (!expectedToken || expectedToken.trim().length < 16)) {
    console.error('[cron/reminders] CRON_SECRET is not configured or is too short (must be at least 16 characters)');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Reject immediately if the header is missing or does not match
  if (!authHeader || !safeCompare(authHeader, `Bearer ${expectedToken}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now = new Date();

    // Fetch user settings to get custom thresholds
    const allSettings = await UserSettings.find({}).lean().catch(() => []);
    const settingsMap = new Map<string, number>();
    for (const s of allSettings) {
      settingsMap.set(s.userId, s.staleThresholdDays);
    }

    // Query all Applied applications
    const appliedApps = await Application.find({ status: 'Applied' });

    // Filter stale applications based on custom/default threshold and snooze status
    const staleApps = appliedApps.filter((app) => {
      const thresholdDays = settingsMap.get(app.userId) ?? 14;
      return isStaleApplication(
        {
          status: app.status,
          lastUpdated: app.lastUpdated,
          lastReminderSent: app.lastReminderSent,
          snoozedUntil: app.snoozedUntil,
        },
        now,
        thresholdDays
      );
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    let sent = 0;
    let errors = 0;

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

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

        const deepLink = `${baseUrl}/dashboard?appId=${app._id}`;

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@jobtracker.app',
          to: app.userEmail,
          subject: 'Follow up on your application',
          html: `<p>Don't forget to follow up on your application for <strong>${app.role}</strong> at <strong>${app.company}</strong>.</p>
<p><a href="${deepLink}" style="display: inline-block; padding: 10px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Follow Up on Trackerr</a></p>`,
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
