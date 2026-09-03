-- Auth foundation: users, sessions, audit_events
-- Prepares for future projects / project_memberships (not created here)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL,
  name VARCHAR(200) NOT NULL,
  password_hash TEXT NOT NULL,
  kind VARCHAR(32) NOT NULL CHECK (kind IN ('permanent', 'temporary')),
  platform_role VARCHAR(32) NOT NULL CHECK (platform_role IN ('owner', 'admin', 'operator', 'viewer')),
  status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'active', 'disabled', 'expired')),
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NULL,
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX users_status_idx ON users (status);
CREATE INDEX users_platform_role_idx ON users (platform_role);
CREATE INDEX users_expires_at_idx ON users (expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  ip INET NULL,
  user_agent TEXT NULL,
  CONSTRAINT sessions_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NULL REFERENCES users (id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NULL,
  resource_id VARCHAR(128) NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_events_actor_id_idx ON audit_events (actor_id);
CREATE INDEX audit_events_action_idx ON audit_events (action);
CREATE INDEX audit_events_created_at_idx ON audit_events (created_at DESC);

-- Future (not created in this migration):
-- CREATE TABLE projects (...);
-- CREATE TABLE project_memberships (...);
