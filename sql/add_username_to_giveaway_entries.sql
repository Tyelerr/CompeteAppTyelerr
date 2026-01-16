-- ============================================================================
-- ADD USERNAME COLUMN TO GIVEAWAY ENTRIES
-- ============================================================================
-- This script adds a username column to both giveaway_entries and 
-- giveaway_entries_archive tables to capture the user's username when they
-- enter a giveaway.
-- ============================================================================

-- Step 1: Add username column to giveaway_entries table
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS username TEXT;

-- Step 2: Add username column to giveaway_entries_archive table
ALTER TABLE giveaway_entries_archive
ADD COLUMN IF NOT EXISTS username TEXT;

-- Step 3: Add comment to document the column
COMMENT ON COLUMN giveaway_entries.username IS 'Username of the user who entered the giveaway (captured from profiles table)';
COMMENT ON COLUMN giveaway_entries_archive.username IS 'Username of the user who entered the giveaway (captured from profiles table)';

-- Step 4: Create index for username lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_username
  ON giveaway_entries(username)
  WHERE username IS NOT NULL;

-- Verification
DO $$
DECLARE
  v_entries_has_username BOOLEAN;
  v_archive_has_username BOOLEAN;
BEGIN
  -- Check if username column exists in giveaway_entries
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'giveaway_entries' AND column_name = 'username'
  ) INTO v_entries_has_username;

  -- Check if username column exists in giveaway_entries_archive
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'giveaway_entries_archive' AND column_name = 'username'
  ) INTO v_archive_has_username;

  IF v_entries_has_username AND v_archive_has_username THEN
    RAISE NOTICE '✅ SUCCESS: username column added to both tables';
    RAISE NOTICE '✅ giveaway_entries.username: EXISTS';
    RAISE NOTICE '✅ giveaway_entries_archive.username: EXISTS';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next step: Run update_fn_enter_giveaway_with_username.sql';
  ELSE
    IF NOT v_entries_has_username THEN
      RAISE WARNING '⚠️  WARNING: username column missing from giveaway_entries';
    END IF;
    IF NOT v_archive_has_username THEN
      RAISE WARNING '⚠️  WARNING: username column missing from giveaway_entries_archive';
    END IF;
  END IF;
END $$;
