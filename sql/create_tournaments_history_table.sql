-- Create tournaments_history table for storing archived/deleted tournaments
-- This table will store tournaments that have passed their date or been deleted

CREATE TABLE IF NOT EXISTS tournaments_history (
    -- Copy all fields from tournaments table
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_unique_number INTEGER NOT NULL,
    parent_recurring_tournament_id INTEGER,
    uuid TEXT NOT NULL,
    tournament_name TEXT NOT NULL,
    game_type TEXT NOT NULL,
    format TEXT NOT NULL,
    director_name TEXT NOT NULL,
    description TEXT,
    equipment TEXT,
    custom_equipment TEXT,
    game_spot TEXT,
    venue TEXT,
    venue_lat TEXT,
    venue_lng TEXT,
    address TEXT,
    phone TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    thumbnail_type TEXT,
    thumbnail_url TEXT,
    start_date DATE NOT NULL,
    strart_time TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    reports_to_fargo BOOLEAN DEFAULT FALSE,
    is_open_tournament BOOLEAN DEFAULT FALSE,
    race_details TEXT,
    number_of_tables INTEGER,
    table_size TEXT,
    max_fargo INTEGER,
    tournament_fee DECIMAL(10,2),
    side_pots JSONB,
    status TEXT NOT NULL,
    required_fargo_games INTEGER,
    has_required_fargo_games BOOLEAN DEFAULT FALSE,
    green_fee DECIMAL(10,2),
    has_green_fee BOOLEAN DEFAULT FALSE,
    recurring_series_id UUID,
    is_recurring_master BOOLEAN DEFAULT FALSE,
    point_location GEOMETRY(POINT, 4326),
    venue_id INTEGER,
    
    -- Original tournament metadata
    original_id UUID NOT NULL, -- Reference to original tournament ID
    original_created_at TIMESTAMPTZ,
    original_updated_at TIMESTAMPTZ,
    original_deleted_at TIMESTAMPTZ,
    
    -- Archival metadata
    archived_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    archived_reason TEXT NOT NULL, -- 'expired', 'deleted', 'manual'
    archived_by_user_id TEXT, -- User who triggered the archival (if applicable)
    
    -- Profile data snapshot (denormalized for historical accuracy)
    creator_profile_id TEXT,
    creator_user_name TEXT,
    creator_email TEXT,
    creator_name TEXT,
    
    -- Venue data snapshot (denormalized for historical accuracy)
    venue_snapshot JSONB -- Store venue data as JSON for historical reference
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tournaments_history_original_id 
ON tournaments_history(original_id);

CREATE INDEX IF NOT EXISTS idx_tournaments_history_archived_at 
ON tournaments_history(archived_at);

CREATE INDEX IF NOT EXISTS idx_tournaments_history_archived_reason 
ON tournaments_history(archived_reason);

CREATE INDEX IF NOT EXISTS idx_tournaments_history_start_date 
ON tournaments_history(start_date);

CREATE INDEX IF NOT EXISTS idx_tournaments_history_recurring_series 
ON tournaments_history(recurring_series_id) 
WHERE recurring_series_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tournaments_history_creator 
ON tournaments_history(creator_profile_id);

CREATE INDEX IF NOT EXISTS idx_tournaments_history_venue_id 
ON tournaments_history(venue_id) 
WHERE venue_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE tournaments_history IS 'Historical archive of tournaments that have been deleted or expired';
COMMENT ON COLUMN tournaments_history.original_id IS 'Reference to the original tournament ID in the tournaments table';
COMMENT ON COLUMN tournaments_history.archived_at IS 'Timestamp when the tournament was archived';
COMMENT ON COLUMN tournaments_history.archived_reason IS 'Reason for archival: expired, deleted, or manual';
COMMENT ON COLUMN tournaments_history.archived_by_user_id IS 'User ID who triggered the archival (if applicable)';
COMMENT ON COLUMN tournaments_history.creator_profile_id IS 'Snapshot of tournament creator profile ID';
COMMENT ON COLUMN tournaments_history.venue_snapshot IS 'JSON snapshot of venue data at time of archival';

-- Create a view for easy querying of archived tournaments with reason breakdown
CREATE OR REPLACE VIEW tournaments_history_summary AS
SELECT 
    archived_reason,
    COUNT(*) as tournament_count,
    MIN(start_date) as earliest_tournament_date,
    MAX(start_date) as latest_tournament_date,
    MIN(archived_at) as first_archived_at,
    MAX(archived_at) as last_archived_at
FROM tournaments_history 
GROUP BY archived_reason;

COMMENT ON VIEW tournaments_history_summary IS 'Summary view of archived tournaments grouped by archival reason';
