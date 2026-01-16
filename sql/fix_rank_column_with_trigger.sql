-- ============================================================================
-- FIX: Auto-populate rank column when inserting winners
-- ============================================================================
-- This allows the old code to work without modification by automatically
-- calculating the rank when a new winner is inserted
-- ============================================================================

-- Create a function to auto-set rank before insert
CREATE OR REPLACE FUNCTION auto_set_winner_rank()
RETURNS TRIGGER AS $$
DECLARE
  next_rank INTEGER;
BEGIN
  -- If rank is not provided (NULL), calculate it
  IF NEW.rank IS NULL THEN
    -- Get the current max rank for this giveaway and add 1
    SELECT COALESCE(MAX(rank), 0) + 1
    INTO next_rank
    FROM giveaway_winners
    WHERE giveaway_id = NEW.giveaway_id;
    
    NEW.rank := next_rank;
  END IF;
  
  -- If selected_at is not provided but picked_at is, copy it
  IF NEW.selected_at IS NULL AND NEW.picked_at IS NOT NULL THEN
    NEW.selected_at := NEW.picked_at;
  END IF;
  
  -- If picked_at is not provided but selected_at is, copy it
  IF NEW.picked_at IS NULL AND NEW.selected_at IS NOT NULL THEN
    NEW.picked_at := NEW.selected_at;
  END IF;
  
  -- If claim_deadline is not provided, set it to 7 days from now
  IF NEW.claim_deadline IS NULL THEN
    NEW.claim_deadline := NOW() + INTERVAL '7 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_set_winner_rank ON giveaway_winners;

-- Create trigger to run before insert
CREATE TRIGGER trigger_auto_set_winner_rank
  BEFORE INSERT ON giveaway_winners
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_winner_rank();

-- Test the trigger
DO $$
BEGIN
  RAISE NOTICE '✅ Auto-rank trigger created successfully';
  RAISE NOTICE 'The trigger will automatically:';
  RAISE NOTICE '  - Set rank to next available number if not provided';
  RAISE NOTICE '  - Sync picked_at and selected_at timestamps';
  RAISE NOTICE '  - Set claim_deadline to 7 days from now if not provided';
END $$;
