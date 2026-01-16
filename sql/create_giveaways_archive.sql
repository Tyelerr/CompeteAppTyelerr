-- ============================================================================
-- GIVEAWAY ARCHIVAL SYSTEM - Archive Tables Creation
-- ============================================================================
-- This script creates archive tables for giveaways and their entries
-- Similar to the tournament archival system, this preserves all deleted data
-- for historical/audit purposes
-- ============================================================================

-- ============================================================================
-- 1. CREATE GIVEAWAYS_ARCHIVE TABLE
-- ============================================================================
-- This table mirrors the giveaways table structure and adds archival metadata

CREATE TABLE IF NOT EXISTS giveaways_archive AS 
SELECT * FROM giveaways WHERE 1=0; -- Copy structure but no data

-- Add archival metadata fields
ALTER TABLE giveaways_archive 
ADD COLUMN IF NOT EXISTS removal_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE giveaways_archive 
ADD COLUMN IF NOT EXISTS removal_reason TEXT DEFAULT 'expired';

ALTER TABLE giveaways_archive 
ADD COLUMN IF NOT EXISTS removed_by_admin_id TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_giveaways_archive_removal_date 
ON giveaways_archive(removal_date);

CREATE INDEX IF NOT EXISTS idx_giveaways_archive_removal_reason 
ON giveaways_archive(removal_reason);

CREATE INDEX IF NOT EXISTS idx_giveaways_archive_end_at 
ON giveaways_archive(end_at);

CREATE INDEX IF NOT EXISTS idx_giveaways_archive_status 
ON giveaways_archive(status);

CREATE INDEX IF NOT EXISTS idx_giveaways_archive_numeric_id 
ON giveaways_archive(numeric_id);

-- Add documentation comments
COMMENT ON TABLE giveaways_archive IS 'Archive of giveaways that have ended or been deleted';
COMMENT ON COLUMN giveaways_archive.removal_date IS 'Timestamp when the giveaway was archived';
COMMENT ON COLUMN giveaways_archive.removal_reason IS 'Reason for archival: expired, admin_deletion, ended, etc.';
COMMENT ON COLUMN giveaways_archive.removed_by_admin_id IS 'Admin user ID who deleted the giveaway (if applicable)';

-- ============================================================================
-- 2. CREATE GIVEAWAY_ENTRIES_ARCHIVE TABLE
-- ============================================================================
-- This table mirrors the giveaway_entries table structure and adds archival metadata

CREATE TABLE IF NOT EXISTS giveaway_entries_archive AS 
SELECT * FROM giveaway_entries WHERE 1=0; -- Copy structure but no data

-- Add archival metadata fields
ALTER TABLE giveaway_entries_archive 
ADD COLUMN IF NOT EXISTS removal_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE giveaway_entries_archive 
ADD COLUMN IF NOT EXISTS removal_reason TEXT DEFAULT 'giveaway_archived';

ALTER TABLE giveaway_entries_archive 
ADD COLUMN IF NOT EXISTS archived_giveaway_id UUID;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_archive_removal_date 
ON giveaway_entries_archive(removal_date);

CREATE INDEX IF NOT EXISTS idx_giveaway_entries_archive_giveaway_id 
ON giveaway_entries_archive(giveaway_id);

CREATE INDEX IF NOT EXISTS idx_giveaway_entries_archive_archived_giveaway_id 
ON giveaway_entries_archive(archived_giveaway_id);

CREATE INDEX IF NOT EXISTS idx_giveaway_entries_archive_user_id 
ON giveaway_entries_archive(user_id);

-- Add documentation comments
COMMENT ON TABLE giveaway_entries_archive IS 'Archive of giveaway entries from archived/deleted giveaways';
COMMENT ON COLUMN giveaway_entries_archive.removal_date IS 'Timestamp when the entry was archived';
COMMENT ON COLUMN giveaway_entries_archive.removal_reason IS 'Reason for archival: giveaway_archived, giveaway_deleted, etc.';
COMMENT ON COLUMN giveaway_entries_archive.archived_giveaway_id IS 'Reference to the archived giveaway ID';

-- ============================================================================
-- 3. CREATE SUMMARY VIEWS
-- ============================================================================

-- View for giveaway archival statistics
CREATE OR REPLACE VIEW giveaways_archive_summary AS
SELECT 
    removal_reason,
    COUNT(*) as count,
    SUM(prize_value) as total_prize_value,
    MIN(removal_date) as first_archived,
    MAX(removal_date) as last_archived
FROM giveaways_archive
GROUP BY removal_reason;

COMMENT ON VIEW giveaways_archive_summary IS 'Summary statistics of archived giveaways grouped by removal reason';

-- View for giveaway entries archival statistics
CREATE OR REPLACE VIEW giveaway_entries_archive_summary AS
SELECT 
    removal_reason,
    COUNT(*) as count,
    COUNT(DISTINCT giveaway_id) as unique_giveaways,
    MIN(removal_date) as first_archived,
    MAX(removal_date) as last_archived
FROM giveaway_entries_archive
GROUP BY removal_reason;

COMMENT ON VIEW giveaway_entries_archive_summary IS 'Summary statistics of archived giveaway entries grouped by removal reason';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'giveaways_archive') THEN
        RAISE NOTICE '✅ giveaways_archive table created successfully';
    ELSE
        RAISE NOTICE '❌ giveaways_archive table creation failed';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'giveaway_entries_archive') THEN
        RAISE NOTICE '✅ giveaway_entries_archive table created successfully';
    ELSE
        RAISE NOTICE '❌ giveaway_entries_archive table creation failed';
    END IF;
END $$;

-- Display table structures
SELECT 
    'giveaways_archive' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'giveaways_archive'
ORDER BY ordinal_position;

SELECT 
    'giveaway_entries_archive' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'giveaway_entries_archive'
ORDER BY ordinal_position;
