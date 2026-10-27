-- 0008_create_dentists.sql
-- Dentists with availability, working hours, breaks, leave, blocked slots

CREATE TABLE IF NOT EXISTS dentists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  license_number TEXT,
  specialization TEXT,
  contact_details TEXT,
  availability JSONB DEFAULT '{}',
  working_hours JSONB DEFAULT '{}',
  breaks JSONB DEFAULT '{}',
  leave JSONB DEFAULT '{}',
  blocked_slots JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dentists_clinic_id ON dentists(clinic_id);
