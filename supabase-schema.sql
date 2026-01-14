-- Pending signups (zero user creation until verification)
create extension if not exists pgcrypto;

create table if not exists public.pending_signups (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_encrypted text not null,
  password_iv text not null,
  full_name text not null,
  role text not null,
  phone text,
  mdcn_number text,
  otp_hash text not null,
  otp_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pending_signups enable row level security;

-- No client access to pending signups
create policy "No direct access to pending signups"
on public.pending_signups
for all
using (false)
with check (false);
-- PH-DVault Database Schema for Supabase/PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for hashing functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  blood_group TEXT,
  genotype TEXT,
  date_of_birth DATE,
  gender TEXT,
  -- Doctor-specific fields
  mdcn_number TEXT UNIQUE,
  verification_status TEXT CHECK (verification_status IN ('pending', 'auto_matched', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('allergies', 'chronic_conditions', 'lab_results', 'medications', 'past_treatments', 'vaccinations')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_hash TEXT, -- SHA256 hash for tamper detection
  metadata JSONB DEFAULT '{}', -- Flexible JSON for category-specific data
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'archived')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Tokens table
CREATE TABLE IF NOT EXISTS share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('link', 'code')),
  token TEXT NOT NULL UNIQUE,
  record_ids UUID[] NOT NULL, -- Array of record IDs to share
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  accessed_at TIMESTAMPTZ,
  accessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Logs table (for audit trail)
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'share', 'access_shared')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_mdcn ON profiles(mdcn_number) WHERE mdcn_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_category ON medical_records(category);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_tokens_user_id ON share_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_status ON share_tokens(status);
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires_at ON share_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_record_id ON access_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Medical Records policies
CREATE POLICY "Users can view their own records"
  ON medical_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own records"
  ON medical_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
  ON medical_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records"
  ON medical_records FOR DELETE
  USING (auth.uid() = user_id);

-- Share Tokens policies
CREATE POLICY "Users can view their own share tokens"
  ON share_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own share tokens"
  ON share_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share tokens"
  ON share_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow doctors to view share tokens they've accessed (for audit)
CREATE POLICY "Doctors can view share tokens they accessed"
  ON share_tokens FOR SELECT
  USING (auth.uid() = accessed_by);

-- Access Logs policies
CREATE POLICY "Users can view their own access logs"
  ON access_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create access logs"
  ON access_logs FOR INSERT
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation (from Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::TEXT,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for medical files
-- Note: Run this in Supabase Dashboard > Storage > Create Bucket
-- Bucket name: medical-files
-- Public: false (private bucket)
-- File size limit: 10MB (adjust as needed)
