-- 0011_create_video_calls.sql
-- 1:1 video consultations via GetStream.io; recording disabled by default

CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  stream_call_id TEXT NOT NULL,
  participants TEXT[] NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_calls_appointment_id ON video_calls(appointment_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_stream_call_id ON video_calls(stream_call_id);
