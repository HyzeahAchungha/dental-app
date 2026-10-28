/**
 * GetStream server-side configuration.
 * Stream signing secrets must never be exposed to clients.
 * Call tokens are issued server-side after authorization checks.
 */

import { StreamChat } from 'stream-chat';

export const streamServerClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

export type StreamServerClient = typeof streamServerClient;
