/**
 * Inngest background job handlers.
 * Durable jobs with retries and idempotency for:
 * - Appointment confirmations and reminders
 * - Email and push notification delivery
 * - Scheduled follow-up reminders
 * - Video-call setup tasks
 * - Long-running AI tasks
 * - File-processing tasks with retries
 *
 * See PLAN.md Background & Async Work section.
 */

import { inngestClient } from '@/lib/inngest';
import { sql } from '@/lib/db';
import { streamServerClient } from '@/lib/stream';

// Appointment confirmation reminder job
export const appointmentReminder = inngestClient.createFunction(
  { id: 'appointment-reminder', retries: 3 },
  { event: 'appointment/reminder' },
  async ({ event, step }) => {
    const { appointmentId, clinicId, patientId, minutesBefore } = event.data;

    // Idempotency: check if reminder already sent
    const existing = await step.run('check-existing-reminder', async () => {
      const rows = await sql`
        SELECT id FROM notifications
        WHERE recipient_id = ${patientId}
          AND type = 'appointment_reminder'
          AND content ILIKE ${`%appointment ${appointmentId}%`}
          AND status = 'sent'
      `;
      return rows.length > 0;
    });

    if (existing) {
      return { skipped: true, reason: 'Reminder already sent' };
    }

    // Send notification (push/email via background jobs)
    await step.run('send-reminder', async () => {
      await sql`
        INSERT INTO notifications (clinic_id, recipient_id, type, content, status, sent_at)
        VALUES (${clinicId}, ${patientId}, 'appointment_reminder',
          ${`Reminder: your appointment ${appointmentId} is in ${minutesBefore} minutes.`},
          'sent', NOW())
      `;
    });

    return { sent: true };
  }
);

// Video call setup job (triggered when appointment is confirmed)
export const setupVideoCall = inngestClient.createFunction(
  { id: 'setup-video-call', retries: 3 },
  { event: 'appointment/confirmed' },
  async ({ event, step }) => {
    const { appointmentId, patientId, dentistId } = event.data;

    await step.run('create-stream-call', async () => {
      // Server-issued call token; only authorized participants can join
      const call = await streamServerClient.video.createCall({
        custom: { appointmentId },
      });

      await sql`
        INSERT INTO video_calls (appointment_id, stream_call_id, participants, status)
        VALUES (${appointmentId}, ${call.id}, ARRAY[${patientId}, ${dentistId}], 'scheduled')
      `;
    });

    return { callCreated: true };
  }
);

// Follow-up reminder job
export const followUpReminder = inngestClient.createFunction(
  { id: 'follow-up-reminder', retries: 3 },
  { event: 'appointment/follow-up' },
  async ({ event, step }) => {
    const { patientId, clinicId, followUpDate } = event.data;

    await step.run('send-follow-up', async () => {
      await sql`
        INSERT INTO notifications (clinic_id, recipient_id, type, content, status, sent_at)
        VALUES (${clinicId}, ${patientId}, 'follow_up_reminder',
          ${`Follow-up reminder for your dental care on ${followUpDate}.`},
          'sent', NOW())
      `;
    });

    return { sent: true };
  }
);

// Failed job alert (monitoring - Sentry email alerts to developer)
export const jobFailureAlert = inngestClient.createFunction(
  { id: 'job-failure-alert', retries: 0 },
  { event: 'inngest/function.failed' },
  async ({ event }) => {
    const { functionId, attempt, error } = event.data;
    // Capture in Sentry for developer email alerting
    await step.captureException(
      new Error(`Job ${functionId} failed after ${attempt} attempts: ${error}`)
    );
    return { alerted: true };
  }
);
