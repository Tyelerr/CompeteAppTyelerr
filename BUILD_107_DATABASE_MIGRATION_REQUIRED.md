# Build 107 - Database Migration Required

## Issue

The "Pick Winner" functionality is failing with error:

```
Could not find the 'winner_entry_id' column of 'giveaways' in the schema cache
```

## Root Cause

The `giveaways` table is missing the `winner_entry_id` column that's needed to store which entry won the giveaway.

## Solution

### Step 1: Apply Database Migration

You need to run the SQL migration in your Supabase database:

**File:** `CompeteApp/sql/add_winner_entry_id_to_giveaways.sql`

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `add_winner_entry_id_to_giveaways.sql`:

```sql
-- Add winner_entry_id column to giveaways table
-- This column stores the ID of the winning entry for each giveaway

-- Add the column if it doesn't exist
ALTER TABLE giveaways
ADD COLUMN IF NOT EXISTS winner_entry_id UUID REFERENCES giveaway_entries(id) ON DELETE SET NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_giveaways_winner_entry_id ON giveaways(winner_entry_id);

-- Add a comment to document the column
COMMENT ON COLUMN giveaways.winner_entry_id IS 'References the winning entry for this giveaway';
```

5. Click **Run** to execute the migration
6. Verify success message appears

#### Option B: Via Supabase CLI

```bash
cd CompeteApp
supabase db push
```

### Step 2: Verify Migration

After running the migration, verify the column was added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'giveaways'
AND column_name = 'winner_entry_id';
```

You should see:

```
column_name      | data_type
-----------------+-----------
winner_entry_id  | uuid
```

### Step 3: Test the Feature

1. Open the app
2. Navigate to Shop → Manage tab
3. Click "Pick Winner" on a giveaway
4. Click "Pick Random Winner"
5. Verify winner is selected without errors
6. Verify success message appears
7. Verify giveaway status updates to "ended"

## What This Column Does

- **Purpose:** Stores the UUID of the winning giveaway entry
- **Type:** UUID (foreign key to giveaway_entries table)
- **Nullable:** Yes (NULL until a winner is picked)
- **On Delete:** SET NULL (if entry is deleted, just clear the reference)
- **Indexed:** Yes (for faster queries)

## Files Involved

- `CompeteApp/sql/add_winner_entry_id_to_giveaways.sql` - Migration script
- `CompeteApp/screens/Shop/ScreenShop.tsx` - Uses this column to update winner
- `CompeteApp/screens/Shop/ModalPickWinner.tsx` - Displays winner selection

## Status

⚠️ **DATABASE MIGRATION REQUIRED** - Run the SQL migration before testing the Pick Winner feature.

After applying the migration, the Pick Winner functionality will work correctly.
