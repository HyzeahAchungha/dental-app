-- 0001_create_user_identities.sql
-- Shared user identities linked across clinics via Clerk subject ID

CREATE TABLE IF NOT EXISTS user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  clerk_subject_id TEXT NOT NULL UNIQUE,
  auth_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_identities_clerk_subject ON user_identities(clerk_subject_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_email ON user_identities(email);
