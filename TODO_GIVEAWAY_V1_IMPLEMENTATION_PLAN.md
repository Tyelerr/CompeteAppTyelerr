# 🎁 Giveaway System v1 - Complete Implementation Plan

## Overview

This document outlines the complete redesign of the giveaway system to implement the Final Giveaway v1 Settings with proper database schema, backend enforcement, and UI updates.

---

## 📋 Current State Analysis

### Current Database Schema

**giveaways table:**

- Has: id, title, description, prize_value, status, image_url, winner_entry_id, etc.
- Missing: max_entries, entry_count_cached, min_age (enforced ≥18), claim_period_days, winner_lock_until

**giveaway_entries table:**

- Has: id, giveaway_id, user_id, entry_number, email, phone, name, birthday
- Missing: status (valid/disqualified), disqualified_reason, disqualified_at, disqualified_by
- Missing: UNIQUE constraint on (giveaway_id, user_id)

**giveaway_winners table:**

- Does NOT exist - needs to be created

### Current Issues

1. No proper winner selection system with alternates
2. No entry validation/disqualification system
3. No 1-minute winner draw lock
4. No claim period enforcement
5. Status enum doesn't match requirements (has 'active', 'ended', 'scheduled', 'archived' but needs 'draft', 'active', 'full', 'drawn', 'closed')

---

## 🎯 Implementation Steps

### STEP 1: Database Schema Updates

#### 1.1 Update `giveaways` table

```sql
-- File: CompeteApp/sql/giveaway_v1_schema_updates.sql

-- ============================================================================
-- GIVEAWAY V1 SCHEMA UPDATES
-- ============================================================================

-- Add new columns to giveaways table
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

-- Update status enum to match v1 requirements
-- First, update existing statuses to new values
UPDATE giveaways SET status = 'active' WHERE status = 'scheduled';
UPDATE giveaways SET status = 'closed' WHERE status = 'ended';
UPDATE giveaways SET status = 'closed' WHERE status = 'archived';

-- Drop old constraint and create new one
ALTER TABLE giveaways DROP CONSTRAINT IF EXISTS giveaways_status_check;
ALTER TABLE giveaways ADD CONSTRAINT giveaways_status_check
  CHECK (status IN ('draft', 'active', 'full', 'drawn', 'closed'));

-- Create index for winner lock queries
CREATE INDEX IF NOT EXISTS idx_giveaways_winner_lock
  ON giveaways(winner_lock_until)
  WHERE winner_lock_until IS NOT NULL;

-- Create index for entry count queries
CREATE INDEX IF NOT EXISTS idx_giveaways_entry_count
  ON giveaways(entry_count_cached, max_entries);

COMMENT ON COLUMN giveaways.max_entries IS 'Maximum number of entries allowed (required)';
COMMENT ON COLUMN giveaways.entry_count_cached IS 'Cached count of valid entries';
COMMENT ON COLUMN giveaways.min_age IS 'Minimum age requirement (enforced ≥18)';
COMMENT ON COLUMN giveaways.claim_period_days IS 'Days winner has to claim prize (default 7)';
COMMENT ON COLUMN giveaways.winner_lock_until IS '1-minute lock timestamp during winner selection';
COMMENT ON COLUMN giveaways.prize_name IS 'Name of the prize';
COMMENT ON COLUMN giveaways.prize_arv IS 'Approximate Retail Value of prize';
COMMENT ON COLUMN giveaways.eligibility_text IS 'Additional eligibility requirements text';
```

#### 1.2 Update `giveaway_entries` table

```sql
-- Add entry validation columns
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'disqualified')),
ADD COLUMN IF NOT EXISTS disqualified_reason TEXT,
ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disqualified_by UUID REFERENCES auth.users(id);

-- Add unique constraint for one entry per user per giveaway
ALTER TABLE giveaway_entries
ADD CONSTRAINT giveaway_entries_user_giveaway_unique
  UNIQUE (giveaway_id, user_id);

-- Create index for valid entries queries
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_status
  ON giveaway_entries(giveaway_id, status)
  WHERE status = 'valid';

COMMENT ON COLUMN giveaway_entries.status IS 'Entry validity status (valid or disqualified)';
COMMENT ON COLUMN giveaway_entries.disqualified_reason IS 'Reason for disqualification';
COMMENT ON COLUMN giveaway_entries.disqualified_at IS 'Timestamp when entry was disqualified';
COMMENT ON COLUMN giveaway_entries.disqualified_by IS 'Admin user who disqualified the entry';
```

#### 1.3 Create `giveaway_winners` table

```sql
-- ============================================================================
-- CREATE GIVEAWAY_WINNERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS giveaway_winners (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES giveaway_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Ranking (1 = primary winner, 2+ = alternates)
  rank INTEGER NOT NULL CHECK (rank > 0),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'selected' CHECK (status IN ('selected', 'notified', 'claimed', 'forfeited', 'disqualified')),

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
CREATE INDEX idx_giveaway_winners_giveaway ON giveaway_winners(giveaway_id);
CREATE INDEX idx_giveaway_winners_user ON giveaway_winners(user_id);
CREATE INDEX idx_giveaway_winners_status ON giveaway_winners(giveaway_id, status);
CREATE INDEX idx_giveaway_winners_rank ON giveaway_winners(giveaway_id, rank);

-- Comments
COMMENT ON TABLE giveaway_winners IS 'Tracks selected winners and alternates for giveaways';
COMMENT ON COLUMN giveaway_winners.rank IS 'Winner rank: 1 = primary winner, 2+ = alternates';
COMMENT ON COLUMN giveaway_winners.status IS 'Winner status: selected, notified, claimed, forfeited, disqualified';
COMMENT ON COLUMN giveaway_winners.claim_deadline IS 'Deadline for winner to claim prize';

-- Enable RLS
ALTER TABLE giveaway_winners ENABLE ROW LEVEL SECURITY;

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

-- Trigger for updated_at
CREATE TRIGGER update_giveaway_winners_updated_at
  BEFORE UPDATE ON giveaway_winners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### STEP 2: Backend RPC Functions

#### 2.1 Pick Winner Function

```sql
-- File: CompeteApp/sql/fn_pick_giveaway_winner.sql

-- ============================================================================
-- PICK GIVEAWAY WINNER RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_pick_giveaway_winner(
  p_giveaway_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role TEXT;
  v_giveaway RECORD;
  v_valid_entry_count INTEGER;
  v_random_entry RECORD;
  v_winner_rank INTEGER;
  v_claim_deadline TIMESTAMPTZ;
BEGIN
  -- Verify caller is admin
  SELECT role INTO v_caller_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller_role NOT IN ('compete-admin', 'master-administrator') THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Only admins can pick winners'
    );
  END IF;

  -- Get giveaway details
  SELECT * INTO v_giveaway
  FROM giveaways
  WHERE id = p_giveaway_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Giveaway not found'
    );
  END IF;

  -- Verify giveaway status
  IF v_giveaway.status NOT IN ('active', 'full') THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Giveaway must be active or full to pick winner'
    );
  END IF;

  -- Check winner lock
  IF v_giveaway.winner_lock_until IS NOT NULL
     AND v_giveaway.winner_lock_until > NOW() THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Winner selection is locked. Please wait.',
      'lock_until', v_giveaway.winner_lock_until
    );
  END IF;

  -- Count valid entries
  SELECT COUNT(*) INTO v_valid_entry_count
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id
    AND status = 'valid';

  -- Verify we have enough entries
  IF v_valid_entry_count < v_giveaway.max_entries THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Not enough entries. Need ' || v_giveaway.max_entries || ', have ' || v_valid_entry_count
    );
  END IF;

  -- Set 1-minute lock
  UPDATE giveaways
  SET winner_lock_until = NOW() + INTERVAL '1 minute'
  WHERE id = p_giveaway_id;

  -- Select random valid entry that hasn't won yet
  SELECT * INTO v_random_entry
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id
    AND status = 'valid'
    AND id NOT IN (
      SELECT entry_id FROM giveaway_winners WHERE giveaway_id = p_giveaway_id
    )
  ORDER BY RANDOM()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'No eligible entries found'
    );
  END IF;

  -- Determine winner rank
  SELECT COALESCE(MAX(rank), 0) + 1 INTO v_winner_rank
  FROM giveaway_winners
  WHERE giveaway_id = p_giveaway_id;

  -- Calculate claim deadline
  v_claim_deadline := NOW() + (v_giveaway.claim_period_days || ' days')::INTERVAL;

  -- Insert winner
  INSERT INTO giveaway_winners (
    giveaway_id,
    entry_id,
    user_id,
    rank,
    status,
    claim_deadline
  ) VALUES (
    p_giveaway_id,
    v_random_entry.id,
    v_random_entry.user_id,
    v_winner_rank,
    'selected',
    v_claim_deadline
  );

  -- Update giveaway status to 'drawn' if this is the first winner
  IF v_winner_rank = 1 THEN
    UPDATE giveaways
    SET status = 'drawn'
    WHERE id = p_giveaway_id;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'winner', json_build_object(
      'entry_id', v_random_entry.id,
      'entry_number', v_random_entry.entry_number,
      'user_id', v_random_entry.user_id,
      'name', v_random_entry.name,
      'email', v_random_entry.email,
      'rank', v_winner_rank,
      'claim_deadline', v_claim_deadline
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION fn_pick_giveaway_winner IS
'Picks a random winner from valid entries with 1-minute lock and rank tracking';
```

#### 2.2 Update Entry Count Trigger

```sql
-- File: CompeteApp/sql/trigger_update_entry_count.sql

-- ============================================================================
-- TRIGGER TO UPDATE CACHED ENTRY COUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_giveaway_entry_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_valid_count INTEGER;
  v_max_entries INTEGER;
BEGIN
  -- Count valid entries for this giveaway
  SELECT COUNT(*) INTO v_valid_count
  FROM giveaway_entries
  WHERE giveaway_id = COALESCE(NEW.giveaway_id, OLD.giveaway_id)
    AND status = 'valid';

  -- Get max entries
  SELECT max_entries INTO v_max_entries
  FROM giveaways
  WHERE id = COALESCE(NEW.giveaway_id, OLD.giveaway_id);

  -- Update cached count and status
  UPDATE giveaways
  SET
    entry_count_cached = v_valid_count,
    status = CASE
      WHEN v_valid_count >= v_max_entries AND status = 'active' THEN 'full'
      ELSE status
    END
  WHERE id = COALESCE(NEW.giveaway_id, OLD.giveaway_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_entry_count ON giveaway_entries;

-- Create trigger
CREATE TRIGGER trigger_update_entry_count
  AFTER INSERT OR UPDATE OR DELETE ON giveaway_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_giveaway_entry_count();

COMMENT ON FUNCTION update_giveaway_entry_count IS
'Updates cached entry count and auto-sets status to full when max reached';
```

#### 2.3 Update Enter Giveaway Function

```sql
-- File: CompeteApp/sql/fn_enter_giveaway_v1.sql

-- ============================================================================
-- ENTER GIVEAWAY FUNCTION V1
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_enter_giveaway_v1(
  p_giveaway_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_birthday DATE,
  p_agree_18 BOOLEAN DEFAULT FALSE,
  p_agree_terms BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_giveaway RECORD;
  v_entry_count INTEGER;
  v_user_age INTEGER;
  v_next_entry_number INTEGER;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You must be logged in to enter a giveaway'
    );
  END IF;

  -- Verify agreements
  IF NOT p_agree_18 OR NOT p_agree_terms THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You must agree to all terms to enter'
    );
  END IF;

  -- Get giveaway details
  SELECT * INTO v_giveaway
  FROM giveaways
  WHERE id = p_giveaway_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Giveaway not found'
    );
  END IF;

  -- Check giveaway status
  IF v_giveaway.status NOT IN ('active', 'full') THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'This giveaway is not currently accepting entries'
    );
  END IF;

  -- Check if user already entered
  IF EXISTS (
    SELECT 1 FROM giveaway_entries
    WHERE giveaway_id = p_giveaway_id
      AND user_id = v_user_id
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You have already entered this giveaway'
    );
  END IF;

  -- Verify age requirement (minimum 18)
  IF p_birthday IS NOT NULL THEN
    v_user_age := EXTRACT(YEAR FROM AGE(p_birthday));
    IF v_user_age < v_giveaway.min_age THEN
      RETURN json_build_object(
        'success', FALSE,
        'message', 'You must be at least ' || v_giveaway.min_age || ' years old to enter'
      );
    END IF;
  END IF;

  -- Check if giveaway is full
  SELECT entry_count_cached INTO v_entry_count
  FROM giveaways
  WHERE id = p_giveaway_id;

  IF v_entry_count >= v_giveaway.max_entries THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'This giveaway has reached its maximum number of entries'
    );
  END IF;

  -- Get next entry number
  SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_entry_number
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id;

  -- Insert entry
  INSERT INTO giveaway_entries (
    giveaway_id,
    user_id,
    name,
    email,
    phone,
    birthday,
    agreed_to_terms,
    entry_number,
    status
  ) VALUES (
    p_giveaway_id,
    v_user_id,
    p_name,
    p_email,
    p_phone,
    p_birthday,
    p_agree_terms,
    v_next_entry_number,
    'valid'
  );

  RETURN json_build_object(
    'success', TRUE,
    'message', 'Successfully entered giveaway!',
    'entry_number', v_next_entry_number
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'You have already entered this giveaway'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Error entering giveaway: ' || SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION fn_enter_giveaway_v1 IS
'Enter a giveaway with age verification and one-entry-per-user enforcement';
```

---

### STEP 3: TypeScript Interface Updates

#### 3.1 Update CrudGiveaway.tsx

```typescript
// File: CompeteApp/ApiSupabase/CrudGiveaway_V1.tsx

export type GiveawayStatus = 'draft' | 'active' | 'full' | 'drawn' | 'closed';

export type EntryStatus = 'valid' | 'disqualified';

export type WinnerStatus =
  | 'selected'
  | 'notified'
  | 'claimed'
  | 'forfeited'
  | 'disqualified';

export interface IGiveaway {
  id: string;
  numeric_id?: number;
  created_by: string;

  // Core fields
  title: string;
  description?: string;
  prize_name: string;
  prize_arv: number;
  prize_image_url?: string;

  // Entry control
  max_entries: number;
  entry_count_cached: number;

  // Lifecycle
  status: GiveawayStatus;

  // Eligibility
  min_age: number; // enforced ≥18
  eligibility_text?: string;

  // Winner control
  claim_period_days: number;
  winner_lock_until?: string;

  // Audit
  created_at: string;
  updated_at: string;
}

export interface IGiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;

  // Entry details
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  entry_number: number;

  // Validity
  status: EntryStatus;
  disqualified_reason?: string;
  disqualified_at?: string;
  disqualified_by?: string;

  created_at: string;
}

export interface IGiveawayWinner {
  id: string;
  giveaway_id: string;
  entry_id: string;
  user_id: string;

  // Ranking
  rank: number; // 1 = primary, 2+ = alternates

  // Status
  status: WinnerStatus;

  // Timing
  selected_at: string;
  claim_deadline: string;
  notified_at?: string;
  claimed_at?: string;
  resolved_at?: string;

  // Resolution
  resolution_reason?: string;
  resolved_by?: string;
}

/**
 * Pick a winner for a giveaway
 */
export async function pickGiveawayWinner(
  giveawayId: string,
): Promise<{ success: boolean; winner?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('fn_pick_giveaway_winner', {
      p_giveaway_id: giveawayId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error picking winner:', error);
    throw error;
  }
}

/**
 * Fetch winners for a giveaway
 */
export async function fetchGiveawayWinners(
  giveawayId: string,
): Promise<IGiveawayWinner[]> {
  try {
    const { data, error } = await supabase
      .from('giveaway_winners')
      .select('*')
      .eq('giveaway_id', giveawayId)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching winners:', error);
    throw error;
  }
}

/**
 * Disqualify an entry
 */
export async function disqualifyEntry(
  entryId: string,
  reason: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('giveaway_entries')
      .update({
        status: 'disqualified',
        disqualified_reason: reason,
        disqualified_at: new Date().toISOString(),
        disqualified_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', entryId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error disqualifying entry:', error);
    throw error;
  }
}

/**
 * Mark winner as forfeited and allow redraw
 */
export async function forfeitWinner(
  winnerId: string,
  reason: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('giveaway_winners')
      .update({
        status: 'forfeited',
        resolution_reason: reason,
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', winnerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error forfeiting winner:', error);
    throw error;
  }
}
```

---

### STEP 4: UI Component Updates

#### 4.1 Update ModalPickWinner Component

Create a new enhanced pick winner modal that:

- Shows entry count vs max_entries
- Disables button until entries >= max_entries
- Shows 1-minute countdown if locked
- Displays winner rank (primary vs alternate)
- Shows "Pick Another Winner" only if latest winner is forfeited/disqualified

#### 4.2 Update ModalCreateGiveaway Component

- Remove date-based ending (entries only)
- Enforce min_age ≥ 18
- Add prize_name, prize_arv fields
- Update status dropdown to new enum values
- Add claim_period_days field (default 7)

#### 4.3 Update ModalViewGiveaway Component

- Show entry_count_cached / max_entries
- Display winner lock status
- Show all winners with ranks
- Add forfeit/disqualify actions for admins

---

### STEP 5: Deployment Checklist

#### Database Migrations (Run in order)

1. ✅ Run `giveaway_v1_schema_updates.sql`
2. ✅ Run `fn_pick_giveaway_winner.sql`
3. ✅ Run `trigger_update_entry_count.sql`
4. ✅ Run `fn_enter_giveaway_v1.sql`

#### Code Updates

1. ✅ Update `CrudGiveaway.tsx` with new interfaces and functions
2. ✅ Update `InterfacesGlobal.tsx` with new giveaway interfaces
3. ✅ Update `ModalCreateGiveaway.tsx` for new schema
4. ✅ Update `ModalPickWinner.tsx` for new winner selection
5. ✅ Update `ModalViewGiveaway.tsx` for winner display
6. ✅ Update `ModalEnterGiveaway.tsx` for new entry function

#### Testing

1. ✅ Test giveaway creation with new fields
2. ✅ Test entry submission (one per user)
3. ✅ Test status auto-update to 'full'
4. ✅ Test winner selection with lock
5. ✅ Test alternate winner selection
6. ✅ Test forfeit/disqualify flows

---

## 📝 Notes

### Key Differences from Current System

1. **No end dates** - Giveaways end by entry count only
2. **Hard-coded min age 18** - Cannot be changed
3. **One entry per user** - Enforced at database level
4. **Admin-only winner selection** - No automatic draws
5. **1-minute lock** - Prevents double-selection
6. **Rank system** - Primary winner + alternates
7. **Forfeit/disqualify** - Allows manual redraw

### Migration Strategy

- Existing giveaways will need status mapping
- Old winner_entry_id field can be deprecated
- Archive old data before migration
- Run in staging environment first

---

## 🚀 Ready to Implement

This plan provides a complete roadmap for implementing Giveaway v1. Each step is independent and can be tested before moving to the next.

**Estimated Implementation Time:** 4-6 hours
**Testing Time:** 2-3 hours
**Total:** 6-9 hours
