-- ============================================================================
-- FIX: v_giveaways_with_counts View - Real-time Entry Counting
-- ============================================================================
-- This fixes the issue where entry counts show as 0 even after successful entries.
-- The view was using a cached column instead of counting entries in real-time.
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS v_giveaways_with_counts CASCADE;

-- Recreate with real-time entry counting
CREATE OR REPLACE VIEW v_giveaways_with_counts AS
SELECT 
  g.id,
  g.created_by,
  g.title,
  g.description,
  g.prize_name,
  g.prize_arv,
  g.prize_value,
  g.prize_image_url,
  g.image_url,
  g.status,
  g.created_at,
  g.updated_at,
  g.start_at,
  g.end_at,
  g.min_age,
  g.max_entries,
  g.maximum_entries,
  g.claim_period_days,
  g.eligibility_text,
  g.selection_method,
  g.number_of_winners,
  g.draw_mode,
  g.winner_entry_id,
  -- ✅ REAL-TIME COUNT: Count actual entries from giveaway_entries table
  COALESCE(
    (SELECT COUNT(*) 
     FROM giveaway_entries ge 
     WHERE ge.giveaway_id = g.id),
    0
  ) as entries_count
FROM giveaways g
WHERE g.status != 'archived';

-- Grant permissions
GRANT SELECT ON v_giveaways_with_counts TO anon, authenticated;

-- Verification
DO $$
DECLARE
  test_count BIGINT;
BEGIN
  -- Test the view to make sure it works
  SELECT COUNT(*) INTO test_count
  FROM v_giveaways_with_counts;
  
  RAISE NOTICE '✅ View v_giveaways_with_counts has been recreated';
  RAISE NOTICE '✅ Now using real-time entry counting instead of cached values';
  RAISE NOTICE '✅ Found % giveaway(s) in the view', test_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Entry counts should now update immediately!';
END $$;
