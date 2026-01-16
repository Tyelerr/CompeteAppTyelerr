# Build 151 - Database View Fix Required

## Critical Issue

The error "column v_giveaways_with_counts.prize_image_url does not exist" indicates that the database view needs to be updated to include the `prize_image_url` column.

## The Problem

- The giveaways table has a `prize_image_url` column
- The view `v_giveaways_with_counts` doesn't expose this column
- The app is trying to query for `prize_image_url` from the view
- This causes the query to fail and giveaways don't load

## Solution Required

### **STEP 1: Apply SQL Fix in Supabase**

You need to run the SQL script in your Supabase SQL Editor:

**File:** `CompeteApp/sql/fix_v_giveaways_with_counts_add_prize_image_url.sql`

This will:

1. Drop the existing view
2. Recreate it with the `prize_image_url` column included
3. Keep `image_url` for backwards compatibility
4. Grant proper permissions

### **STEP 2: How to Apply**

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `fix_v_giveaways_with_counts_add_prize_image_url.sql`
4. Run the SQL script
5. Verify the view was created successfully

### **STEP 3: Verify**

After running the SQL, test in Supabase SQL Editor:

```sql
SELECT id, title, prize_image_url, image_url
FROM v_giveaways_with_counts
LIMIT 5;
```

Both `prize_image_url` and `image_url` should now be available.

## Why This Happened

The database view was created before the `prize_image_url` column was added to the giveaways table, or it was created with a different column name (`image_url`). Views don't automatically update when table schemas change - they must be manually recreated.

## Current Status

- ✅ App code updated to use `prize_image_url`
- ✅ Build number updated to 151
- ❌ **Database view needs to be updated** (requires manual SQL execution in Supabase)

## After Applying the SQL Fix

Once you've run the SQL script in Supabase:

1. The Giveaways tab should load properly
2. Images should display in both Giveaways and Manage tabs
3. No more "column does not exist" errors

## Important Note

**You must apply the SQL fix in Supabase before the app will work correctly.** The app code is ready, but the database view needs to be updated manually through the Supabase dashboard.
