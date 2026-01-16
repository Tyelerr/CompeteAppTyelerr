-- Create enhanced tournament likes system that tracks both historical and current data
-- This will work alongside the existing 'likes' table

-- Create a likes_history table to track all like/unlike actions
CREATE TABLE IF NOT EXISTS tournament_likes_history (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(10) NOT NULL CHECK (action IN ('like', 'unlike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_tournament_id ON tournament_likes_history(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_user_id ON tournament_likes_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_action ON tournament_likes_history(action);
CREATE INDEX IF NOT EXISTS idx_tournament_likes_history_created_at ON tournament_likes_history(created_at);

-- Create a function to get comprehensive tournament likes statistics for a venue
CREATE OR REPLACE FUNCTION get_venue_tournament_likes_comprehensive_stats(
    p_venue_id INTEGER
)
RETURNS TABLE (
    total_historical_likes BIGINT,
    current_active_likes BIGINT,
    unique_users_who_liked BIGINT,
    likes_this_week BIGINT,
    likes_this_month BIGINT
) AS $$
BEGIN
    -- Get all tournaments for this venue
    WITH venue_tournaments AS (
        SELECT id FROM tournaments WHERE venue_id = p_venue_id
    ),
    -- Historical likes (all 'like' actions ever recorded)
    historical_stats AS (
        SELECT COUNT(*) as total_historical
        FROM tournament_likes_history tlh
        JOIN venue_tournaments vt ON tlh.tournament_id = vt.id
        WHERE tlh.action = 'like'
    ),
    -- Current active likes (from existing likes table)
    current_stats AS (
        SELECT COUNT(*) as current_active
        FROM likes l
        JOIN venue_tournaments vt ON l.turnament_id = vt.id  -- Note: using existing column name with typo
        WHERE l.is_liked = true
    ),
    -- Unique users who have ever liked tournaments at this venue
    unique_users_stats AS (
        SELECT COUNT(DISTINCT tlh.user_id) as unique_users
        FROM tournament_likes_history tlh
        JOIN venue_tournaments vt ON tlh.tournament_id = vt.id
        WHERE tlh.action = 'like'
    ),
    -- Likes this week
    week_stats AS (
        SELECT COUNT(*) as week_likes
        FROM tournament_likes_history tlh
        JOIN venue_tournaments vt ON tlh.tournament_id = vt.id
        WHERE tlh.action = 'like'
        AND tlh.created_at >= NOW() - INTERVAL '7 days'
    ),
    -- Likes this month
    month_stats AS (
        SELECT COUNT(*) as month_likes
        FROM tournament_likes_history tlh
        JOIN venue_tournaments vt ON tlh.tournament_id = vt.id
        WHERE tlh.action = 'like'
        AND tlh.created_at >= NOW() - INTERVAL '30 days'
    )
    
    SELECT 
        hs.total_historical,
        cs.current_active,
        uus.unique_users,
        ws.week_likes,
        ms.month_likes
    FROM historical_stats hs
    CROSS JOIN current_stats cs
    CROSS JOIN unique_users_stats uus
    CROSS JOIN week_stats ws
    CROSS JOIN month_stats ms;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically log like/unlike actions
CREATE OR REPLACE FUNCTION log_tournament_like_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new like)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO tournament_likes_history (
            tournament_id, 
            user_id, 
            action, 
            created_at
        ) VALUES (
            NEW.turnament_id,  -- Note: using existing column name with typo
            NEW.user_id,
            'like',
            NOW()
        );
        RETURN NEW;
    END IF;
    
    -- Handle DELETE (unlike)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO tournament_likes_history (
            tournament_id, 
            user_id, 
            action, 
            created_at
        ) VALUES (
            OLD.turnament_id,  -- Note: using existing column name with typo
            OLD.user_id,
            'unlike',
            NOW()
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the existing likes table
DROP TRIGGER IF EXISTS trigger_log_tournament_like_action ON likes;
CREATE TRIGGER trigger_log_tournament_like_action
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION log_tournament_like_action();

-- Add comments for documentation
COMMENT ON TABLE tournament_likes_history IS 'Tracks all like/unlike actions for tournaments to maintain historical data';
COMMENT ON COLUMN tournament_likes_history.tournament_id IS 'Reference to the tournament (UUID)';
COMMENT ON COLUMN tournament_likes_history.user_id IS 'User who performed the like/unlike action';
COMMENT ON COLUMN tournament_likes_history.action IS 'Action performed: like or unlike';
COMMENT ON COLUMN tournament_likes_history.created_at IS 'Timestamp when the action was performed';

COMMENT ON FUNCTION get_venue_tournament_likes_comprehensive_stats(INTEGER) IS 'Returns comprehensive like statistics for all tournaments at a venue';

-- Display the result to confirm table creation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tournament_likes_history'
ORDER BY ordinal_position;
