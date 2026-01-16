# APPLY BUILD 139 DATABASE CHANGES

## CRITICAL: Database Migration Required

Before testing BUILD 139, you **MUST** apply the junction table SQL to your Supabase database.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)

### 2. Apply Junction Table SQL

1. Click **New Query**
2. Copy the ENTIRE contents of: `CompeteApp/sql/create_venue_tournament_directors_table.sql`
3. Paste into the SQL editor
4. Click **Run** or press `Ctrl+Enter`

### 3. Verify Table Creation

You should see output showing:

- Table `venue_tournament_directors` created
- Indexes created
- RLS policies created
- Column information displayed
- Policy information displayed

### 4. Optional: Migrate Existing Data

If you have existing `venues.td_id` assignments, run this migration SQL:

```sql
-- Migrate existing td_id assignments to junction table
INSERT INTO venue_tournament_directors (venue_id, user_id_auto)
SELECT id, td_id
FROM venues
WHERE td_id IS NOT NULL
ON CONFLICT (venue_id, user_id_auto) DO NOTHING;

-- Verify migration
SELECT COUNT(*) as migrated_assignments
FROM venue_tournament_directors;
```

### 5. Test the Changes

After applying the SQL:

1. Restart your app
2. Go to Bar Owner Dashboard
3. Click "My Directors" card
4. Try adding a new tournament director
5. Try adding a second TD to the same venue (should work now!)
6. Try removing a TD using the X button

## What This Enables

### Before BUILD 139:

- ❌ Only ONE tournament director per venue
- ❌ Adding a new TD replaced the existing one
- ❌ X button didn't work

### After BUILD 139:

- ✅ MULTIPLE tournament directors per venue
- ✅ Adding a TD adds to the list (doesn't replace)
- ✅ X button removes specific TD from venue
- ✅ Gray theme styling matches throughout
- ✅ Smart removal (asks which venue if multiple)

## Troubleshooting

### If table creation fails:

```sql
-- Check if table already exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'venue_tournament_directors';

-- If it exists, you can drop and recreate:
DROP TABLE IF EXISTS venue_tournament_directors CASCADE;
-- Then run the create table SQL again
```

### If RLS policies fail:

```sql
-- Check existing policies
SELECT policyname FROM pg_policies
WHERE tablename = 'venue_tournament_directors';

-- Drop all policies if needed:
DROP POLICY IF EXISTS "Anyone can view venue tournament directors" ON venue_tournament_directors;
DROP POLICY IF EXISTS "Bar owners can assign TDs to their venues" ON venue_tournament_directors;
DROP POLICY IF EXISTS "Bar owners can remove TDs from their venues" ON venue_tournament_directors;
-- Then run the create policies SQL again
```

## Verification Queries

After applying changes, verify everything is set up correctly:

```sql
-- 1. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'venue_tournament_directors'
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'venue_tournament_directors';

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'venue_tournament_directors';

-- 4. Check policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'venue_tournament_directors';
```

## Success Criteria

You'll know it worked when:

- ✅ Table `venue_tournament_directors` exists
- ✅ 2 indexes created (venue_id, user_id_auto)
- ✅ RLS is enabled
- ✅ 3 policies exist (SELECT, INSERT, DELETE)
- ✅ App can assign multiple TDs to same venue
- ✅ X button removes TDs successfully

## Need Help?

If you encounter any issues:

1. Check the Supabase logs for error messages
2. Verify your user has the correct role (BarOwner/BarAdmin)
3. Ensure RLS policies are correctly applied
4. Check that the junction table was created successfully
