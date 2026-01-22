-- =====================================================
-- PH-DVault Migration - Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add account management columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_pin_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- 2. Add encrypted data column to medical_records
-- This stores the encrypted description and metadata
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

-- 3. Add metadata to access_logs for richer audit trail
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Add policy to allow users to delete their own profile
DO $$ BEGIN
  CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Add policy to allow users to delete their own share tokens
DO $$ BEGIN
  CREATE POLICY "Users can delete their own share tokens"
    ON share_tokens FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Add policy to allow users to delete their own access logs
DO $$ BEGIN
  CREATE POLICY "Users can delete their own access logs"
    ON access_logs FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Add index for is_deactivated for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_deactivated ON profiles(is_deactivated);

-- Done! Your database now supports:
-- - Account deactivation/deletion
-- - App PIN storage
-- - Emergency contact info
-- - Encrypted medical records
-- - Enhanced access logging
