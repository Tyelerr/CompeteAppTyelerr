-- ============================================================================
-- GIVEAWAY V1 MIGRATION - STEP 5 OF 6
-- ============================================================================
-- Verification - Run this to confirm everything worked
-- RUN THIS AFTER STEP 4 COMPLETES
-- ============================================================================

DO $$
DECLARE
  v_enum_values TEXT;
  v_column_count INTEGER;
  v_table_exists BOOLEAN;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ GIVEAWAY V1 MIGRATION VERIFICATION';
  RAISE NOTICE '============================================================';
  
  -- Check giveaway_status enum
  SELECT string_agg(enumlabel::TEXT, ', ' ORDER BY enumsortorder) INTO v_enum_values
  FROM pg_enum
  WHERE enumtypid = 'giveaway_status'::regtype;
  RAISE NOTICE '✅ giveaway_status enum values: %', v_enum_values;
  
  -- Check giveaways columns
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns 
  WHERE table_name = 'giveaways' 
  AND column_name IN ('max_entries', 'entry_count_cached', 'min_age', 'claim_period_days', 'winner_lock_until', 'prize_name', 'prize_arv');
  
  IF v_column_count = 7 THEN
    RAISE NOTICE '✅ All 7 new giveaways columns exist';
  ELSE
    RAISE WARNING '⚠️ Only % of 7 giveaways columns found', v_column_count;
  END IF;
  
  -- Check giveaway_entries columns
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns 
  WHERE table_name = 'giveaway_entries' 
  AND column_name IN ('status', 'disqualified_reason', 'disqualified_at', 'disqualified_by');
  
  IF v_column_count = 4 THEN
    RAISE NOTICE '✅ All 4 new giveaway_entries columns exist';
  ELSE
    RAISE WARNING '⚠️ Only % of 4 giveaway_entries columns found', v_column_count;
  END IF;
  
  -- Check giveaway_winners table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'giveaway_winners'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    RAISE NOTICE '✅ giveaway_winners table created';
  ELSE
    RAISE WARNING '⚠️ giveaway_winners table not found';
  END IF;
  
  -- Check unique constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'giveaway_entries_user_giveaway_unique'
  ) THEN
    RAISE NOTICE '✅ One-entry-per-user constraint exists';
  ELSE
    RAISE WARNING '⚠️ Unique constraint not found';
  END IF;
  
  -- Check entry_status enum
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_status') THEN
    RAISE NOTICE '✅ entry_status enum type exists';
  ELSE
    RAISE WARNING '⚠️ entry_status enum not found';
  END IF;
  
  -- Check winner_status enum
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'winner_status') THEN
    RAISE NOTICE '✅ winner_status enum type exists';
  ELSE
    RAISE WARNING '⚠️ winner_status enum not found';
  END IF;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '🎉 Migration complete! Next steps:';
  RAISE NOTICE '1. Create RPC functions (fn_pick_giveaway_winner, etc.)';
  RAISE NOTICE '2. Update TypeScript interfaces in CrudGiveaway.tsx';
  RAISE NOTICE '3. Update UI components (ModalCreateGiveaway, etc.)';
  RAISE NOTICE '4. Test the new giveaway system';
  RAISE NOTICE '============================================================';
END $$;
