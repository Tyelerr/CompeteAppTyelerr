-- Create ONLY the tournament_likes_history table
-- This should be run FIRST before the function

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

-- Verify table was created
SELECT 'tournament_likes_history table created successfully' as result;
