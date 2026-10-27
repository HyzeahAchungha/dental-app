-- 0012_create_dental_records.sql
-- Clinical records with version history and audit trail

CREATE TABLE IF NOT EXISTS dental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES user_identities(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  clinical_notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  author TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_dental_records_patient_id ON dental_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_records_clinic_id ON dental_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_dental_records_timestamp ON dental_records(timestamp);
