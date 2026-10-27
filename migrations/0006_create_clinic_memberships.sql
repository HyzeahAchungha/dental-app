-- 0006_create_clinic_memberships.sql
-- Links users to clinics with roles; enables multi-clinic patient accounts

CREATE TABLE IF NOT EXISTS clinic_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_identities(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_user_id ON clinic_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_clinic_id ON clinic_memberships(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_memberships_role ON clinic_memberships(role);
