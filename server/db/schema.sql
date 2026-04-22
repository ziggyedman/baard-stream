-- ─────────────────────────────────────────────────────────────────────────
--  baard database schema
--  Runs automatically on first boot via server/db/migrate.js
-- ─────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),            -- NULL for Google-only accounts
  google_id     VARCHAR(255) UNIQUE,     -- NULL for email/password accounts
  name          VARCHAR(255),
  avatar_url    TEXT,
  plan          VARCHAR(50)  NOT NULL DEFAULT 'free',   -- free | pro | power
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx     ON users (email);
CREATE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id);

-- ── user_settings ─────────────────────────────────────────────────────────
-- One row per user, created automatically on account creation.
CREATE TABLE IF NOT EXISTS user_settings (
  user_id                  UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Privacy & Data
  history_from             DATE        NOT NULL DEFAULT (NOW() - INTERVAL '30 days'),

  -- Appearance
  theme                    VARCHAR(20) NOT NULL DEFAULT 'system',   -- light | dark | system
  density                  VARCHAR(20) NOT NULL DEFAULT 'comfortable',
  font_size                VARCHAR(20) NOT NULL DEFAULT 'medium',
  sidebar_width            VARCHAR(20) NOT NULL DEFAULT 'medium',
  message_grouping         VARCHAR(20) NOT NULL DEFAULT 'platform',
  timestamps_format        VARCHAR(20) NOT NULL DEFAULT 'relative',

  -- Notifications
  notif_browser            BOOLEAN     NOT NULL DEFAULT TRUE,
  notif_sound              BOOLEAN     NOT NULL DEFAULT FALSE,
  notif_badge              BOOLEAN     NOT NULL DEFAULT TRUE,
  notif_priority           VARCHAR(20) NOT NULL DEFAULT 'all',      -- all | direct | mentions | none
  quiet_hours_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
  quiet_hours_start        VARCHAR(5)  NOT NULL DEFAULT '22:00',
  quiet_hours_end          VARCHAR(5)  NOT NULL DEFAULT '08:00',

  -- Per-platform notification overrides (JSON object { slack: true, discord: false, ... })
  notif_per_platform       JSONB       NOT NULL DEFAULT '{}',

  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── platform_connections ──────────────────────────────────────────────────
-- Tracks which platforms a user has connected.
-- OAuth tokens are NEVER stored here — they live encrypted in the user's
-- browser IndexedDB and are passed directly to the relay worker.
CREATE TABLE IF NOT EXISTS platform_connections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id     VARCHAR(50) NOT NULL,
  connected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform_id)
);

CREATE INDEX IF NOT EXISTS platform_connections_user_idx ON platform_connections (user_id);

-- ── updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
    CREATE TRIGGER users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'settings_updated_at') THEN
    CREATE TRIGGER settings_updated_at
      BEFORE UPDATE ON user_settings
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
