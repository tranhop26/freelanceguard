-- FreelanceGuard Initial Schema
-- Migration 001: Users, Jobs, Applications, Messages

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE,
  circle_user_id TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('client', 'freelancer', 'both')) DEFAULT 'both',
  country TEXT,
  reputation_score INT DEFAULT 0,
  jobs_completed INT DEFAULT 0,
  jobs_posted INT DEFAULT 0,
  disputes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- JOBS
-- =========================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_job_id BIGINT UNIQUE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  amount_usdc DECIMAL(18,6) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('open','in_progress','submitted','approved','disputed','resolved','refunded')) DEFAULT 'open',
  deliverable_url TEXT,
  deliverable_notes TEXT,
  dispute_reason TEXT,
  ai_verdict JSONB,
  create_tx_hash TEXT,
  resolve_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- APPLICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  proposed_amount DECIMAL(18,6),
  status TEXT CHECK (status IN ('pending','accepted','rejected','withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, freelancer_id)
);

-- =========================
-- MESSAGES (chat per job)
-- =========================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer ON jobs(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_job ON messages(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- =========================
-- ROW LEVEL SECURITY
-- =========================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Permissive read policies for MVP (tighten in production)
DROP POLICY IF EXISTS "public_read_users" ON users;
DROP POLICY IF EXISTS "public_read_jobs" ON jobs;
DROP POLICY IF EXISTS "public_read_applications" ON applications;
DROP POLICY IF EXISTS "public_read_messages" ON messages;

CREATE POLICY "public_read_users" ON users FOR SELECT USING (true);
CREATE POLICY "public_read_jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "public_read_applications" ON applications FOR SELECT USING (true);
CREATE POLICY "public_read_messages" ON messages FOR SELECT USING (true);

-- Server-side writes use service_role key which bypasses RLS
