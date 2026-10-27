-- 0005_create_clinic_usage.sql
-- Dedicated usage tracking structure

CREATE TABLE IF NOT EXISTS clinic_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, metric_key, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_clinic_usage_clinic_id ON clinic_usage(clinic_id);
