-- ============================================================================
-- GIVEAWAY V1 MIGRATION - STEP 1 OF 5
-- ============================================================================
-- Add new enum values to giveaway_status type
-- RUN THIS FIRST AND ALONE
-- ============================================================================

ALTER TYPE giveaway_status ADD VALUE IF NOT EXISTS 'full';
ALTER TYPE giveaway_status ADD VALUE IF NOT EXISTS 'drawn';
ALTER TYPE giveaway_status ADD VALUE IF NOT EXISTS 'closed';

-- Verify the values were added
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'giveaway_status'::regtype
ORDER BY enumsortorder;
