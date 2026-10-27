-- 0004_create_clinic_entitlements.sql
-- Configurable feature entitlements separate from subscription status

CREATE TABLE IF NOT EXISTS clinic_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  value TEXT,
  limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_clinic_entitlements_clinic_id ON clinic_entitlements(clinic_id);
