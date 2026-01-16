# 🎁 Giveaway V1 Migration - Step-by-Step Guide

## ⚠️ IMPORTANT: PostgreSQL ENUM Limitation

PostgreSQL requires that `ALTER TYPE ADD VALUE` commands be **committed** before the new values can be used. Since Supabase SQL Editor runs scripts in a single transaction, we must split the migration into **separate steps**.

---

## 📋 Migration Steps (Run Each Separately)

### STEP 1: Add New ENUM Values (Run First)

```sql
-- ============================================================================
-- STEP 1: Add new enum values to giveaway_status type
-- ============================================================================
-- Run this FIRST and ALONE, then wait for it to complete

ALTER TYPE giveaway_status ADD VALUE IF NOT EXISTS 'full';
ALTER TYPE giveaway_status ADD VALUE IF NOT EXISTS 'drawn';
ALTER TYPE giveaway_status ADD VALUE IF NOT EXISTS 'closed';

-- Verify the values were added
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'giveaway_status'::regtype
ORDER BY enumsortorder;
```

**✅ Expected Output:** You should see: active, draft, ended, full, drawn, closed (or similar)

---

### STEP 2: Add New Columns and Migrate Data (Run Second)

```sql
-- ============================================================================
-- STEP 2: Add new columns to giveaways table
-- ============================================================================

ALTER TABLE giveaways
ADD COLUMN IF NOT EXISTS max_entries INTEGER NOT NULL DEFAULT 500,
ADD COLUMN IF NOT EXISTS entry_count_cached INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_age INTEGER NOT NULL DEFAULT 18 CHECK (min_age >= 18),
ADD COLUMN IF NOT EXISTS claim_period_days INTEGER NOT NULL DEFAULT 7,
ADD COLUMN IF NOT EXISTS winner_lock_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prize_name TEXT,
ADD COLUMN IF NOT EXISTS prize_arv NUMERIC,
ADD COLUMN IF NOT EXISTS prize_image_url TEXT,
ADD COLUMN IF NOT EXISTS eligibility_text TEXT;

-- Now we can safely migrate status values (enum values exist from Step 1)
UPDATE giveaways SET status = 'closed' WHERE status = 'ended';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_giveaways_winner_lock
  ON giveaways(winner_lock_until)
  WHERE winner_lock_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_giveaways_entry_count
  ON giveaways(entry_count_cached, max_entries);

-- Add comments
COMMENT ON COLUMN giveaways.max_entries IS 'Maximum number of entries allowed (required)';
COMMENT ON COLUMN giveaways.entry_count_cached IS 'Cached count of valid entries';
COMMENT ON COLUMN giveaways.min_age IS 'Minimum age requirement (enforced ≥18)';
COMMENT ON COLUMN giveaways.claim_period_days IS 'Days winner has to claim prize (default 7)';
COMMENT ON COLUMN giveaways.winner_lock_until IS '1-minute lock timestamp during winner selection';
COMMENT ON COLUMN giveaways.prize_name IS 'Name of the prize';
COMMENT ON COLUMN giveaways.prize_arv IS 'Approximate Retail Value of prize';
COMMENT ON COLUMN giveaways.eligibility_text IS 'Additional eligibility requirements text';
```

**✅ Expected Output:** Columns added successfully, data migrated

---

### STEP 3: Update giveaway_entries Table (Run Third)

```sql
-- ============================================================================
-- STEP 3: Update giveaway_entries table
-- ============================================================================

-- Create entry_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_status') THEN
    CREATE TYPE entry_status AS ENUM ('valid', 'disqualified');
  END IF;
END $$;

-- Add entry validation columns
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS status entry_status NOT NULL DEFAULT 'valid',
ADD COLUMN IF NOT EXISTS disqualified_reason TEXT,
ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disqualified_by UUID REFERENCES auth.users(id);

-- Remove duplicate entries (keep the first one)
DELETE FROM giveaway_entries a
USING giveaway_entries b
WHERE a.id > b.id
  AND a.giveaway_id = b.giveaway_id
  AND a.user_id = b.user_id;

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'giveaway_entries_user_giveaway_unique'
  ) THEN
    ALTER TABLE giveaway_entries
    ADD CONSTRAINT giveaway_entries_user_giveaway_unique
      UNIQUE (giveaway_id, user_id);
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_status
  ON giveaway_entries(giveaway_id, status)
  WHERE status = 'valid';

-- Add comments
COMMENT ON COLUMN giveaway_entries.status IS 'Entry validity status (valid or disqualified)';
COMMENT ON COLUMN giveaway_entries.disqualified_reason IS 'Reason for disqualification';
COMMENT ON COLUMN giveaway_entries.disqualified_at IS 'Timestamp when entry was disqualified';
COMMENT ON COLUMN giveaway_entries.disqualified_by IS 'Admin user who disqualified the entry';
```

**✅ Expected Output:** entry_status enum created, columns added, duplicates removed, constraint added

---

### STEP 4: Create giveaway_winners Table (Run Fourth)

```sql
-- ============================================================================
-- STEP 4: Create giveaway_winners table
-- ============================================================================

-- Create winner_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'winner_status') THEN
    CREATE TYPE winner_status AS ENUM ('selected', 'notified', 'claimed', 'forfeited', 'disqualified');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS giveaway_winners (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES giveaway_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Ranking (1 = primary winner, 2+ = alternates)
  rank INTEGER NOT NULL CHECK (rank > 0),

  -- Status tracking
  status winner_status NOT NULL DEFAULT 'selected',

  -- Timestamps
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claim_deadline TIMESTAMPTZ NOT NULL,
  notified_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Resolution details
  resolution_reason TEXT,
  resolved_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE (giveaway_id, rank),
  UNIQUE (giveaway_id, entry_id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_giveaway ON giveaway_winners(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_user ON giveaway_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_status ON giveaway_winners(giveaway_id, status);
CREATE INDEX IF NOT EXISTS idx_giveaway_winners_rank ON giveaway_winners(giveaway_id, rank);

-- Comments
COMMENT ON TABLE giveaway_winners IS 'Tracks selected winners and alternates for giveaways';
COMMENT ON COLUMN giveaway_winners.rank IS 'Winner rank: 1 = primary winner, 2+ = alternates';
COMMENT ON COLUMN giveaway_winners.status IS 'Winner status: selected, notified, claimed, forfeited, disqualified';
COMMENT ON COLUMN giveaway_winners.claim_deadline IS 'Deadline for winner to claim prize';

-- Enable RLS
ALTER TABLE giveaway_winners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view winners" ON giveaway_winners;
DROP POLICY IF EXISTS "Only admins can insert winners" ON giveaway_winners;
DROP POLICY IF EXISTS "Only admins can update winners" ON giveaway_winners;

-- RLS Policies
CREATE POLICY "Anyone can view winners"
  ON giveaway_winners FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert winners"
  ON giveaway_winners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('compete-admin', 'master-administrator')
    )
  );

CREATE POLICY "Only admins can update winners"
  ON giveaway_winners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('compete-admin', 'master-administrator')
    )
  );

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_giveaway_winners_updated_at ON giveaway_winners;
CREATE TRIGGER update_giveaway_winners_updated_at
  BEFORE UPDATE ON giveaway_winners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**✅ Expected Output:** giveaway_winners table created with all indexes and policies

---

### STEP 5: Verification (Run Last)

```sql
-- ============================================================================
-- VERIFICATION - Run this to confirm everything worked
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

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration complete! Next steps:';
  RAISE NOTICE '1. Create RPC functions (fn_pick_giveaway_winner, etc.)';
  RAISE NOTICE '2. Update TypeScript interfaces';
  RAISE NOTICE '3. Update UI components';
  RAISE NOTICE '============================================================';
END $$;
```

**✅ Expected Output:** Verification report showing all components successfully created

---

## 🚀 How to Run

1. **Open Supabase SQL Editor**
2. **Copy and paste STEP 1** → Click "Run" → Wait for success
3. **Copy and paste STEP 2** → Click "Run" → Wait for success
4. **Copy and paste STEP 3** → Click "Run" → Wait for success
5. **Copy and paste STEP 4** → Click "Run" → Wait for success
6. **Copy and paste STEP 5** → Click "Run" → Review verification output

## ⚠️ Why This Approach?

PostgreSQL's `ALTER TYPE ADD VALUE` cannot run in a transaction block. When you add a new enum value, it must be committed before you can use it in UPDATE statements. By running each step separately, Supabase commits each step automatically.

## 🔄 If You Get Errors

- **"enum value already exists"** → Safe to ignore, continue to next step
- **"column already exists"** → Safe to ignore, continue to next step
- **"relation already exists"** → Safe to ignore, continue to next step

All steps use `IF NOT EXISTS` checks, so they're safe to re-run.

---

## ✅ After Migration Complete

Once all 5 steps are complete, you'll have:

- ✅ Updated `giveaways` table with all new fields
- ✅ Updated `giveaway_entries` table with validation
- ✅ New `giveaway_winners` table with rank system
- ✅ All enum types properly configured
- ✅ One-entry-per-user enforcement
- ✅ All indexes and RLS policies

Then proceed with the remaining implementation steps from `TODO_GIVEAWAY_V1_IMPLEMENTATION_PLAN.md`.
