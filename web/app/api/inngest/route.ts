/**
 * Inngest webhook endpoint for Next.js.
 * Receives events from Inngest and triggers background jobs.
 * See PLAN.md Background & Async Work section.
 */

import { serve } from 'inngest/next';
import { appointmentReminder, setupVideoCall, followUpReminder, jobFailureAlert } from '@/lib/inngest-functions';

export const { GET, POST, PUT } = serve({
  handlers: [appointmentReminder, setupVideoCall, followUpReminder, jobFailureAlert],
});
