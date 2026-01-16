-- Fix v_giveaways_with_counts view to include prize_image_url
-- This view needs to be updated to expose the prize_image_url column from the giveaways table

-- First, let's check what columns the view currently has
-- Run this in Supabase SQL Editor to see current structure:
-- SELECT * FROM v_giveaways_with_counts LIMIT 1;

-- Drop and recreate the view with prize_image_url included
-- Note: You may need to adjust this based on your actual view definition

DROP VIEW IF EXISTS v_giveaways_with_counts CASCADE;

CREATE OR REPLACE VIEW v_giveaways_with_counts AS
SELECT 
  g.id,
  g.created_by,
  g.title,
  g.description,
  g.prize_name,
  g.prize_arv,
  g.prize_value,
  g.prize_image_url,  -- ✅ Added this column
  g.image_url,        -- Keep old column for backwards compatibility
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
  g.entry_count_cached,
  COALESCE(g.entry_count_cached, 0) as entries_count
FROM giveaways g
WHERE g.status != 'archived';

-- Grant permissions
GRANT SELECT ON v_giveaways_with_counts TO anon, authenticated;
