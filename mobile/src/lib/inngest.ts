/**
 * Inngest client for durable background jobs with retries and idempotency.
 * Used for: appointment confirmations/reminders, email/push notification delivery,
 * video-call setup tasks, long-running AI tasks, file-processing tasks.
 * See PLAN.md Background & Async Work section.
 */

import { inngest } from 'inngest';

export const inngestClient = inngest({
  id: 'dental-app',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

export type InngestClient = typeof inngestClient;
