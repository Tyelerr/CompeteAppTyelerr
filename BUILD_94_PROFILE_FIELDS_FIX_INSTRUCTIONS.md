# Build 94 - Profile Fields Fix Instructions

## Problem

Home State, Favorite Player, and Favorite Game fields are not saving to the database and showing as blank on the profile page.

## Root Causes Identified

1. ✅ **FIXED IN CODE**: Missing `value` prop on home_state input (uncontrolled component)
2. ✅ **FIXED IN CODE**: Wrong import in ModalProfileEditor (was using old file)
3. ✅ **FIXED IN CODE**: Removed home_city field as requested
4. ⚠️ **NEEDS DATABASE FIX**: RLS policies or column permissions may be blocking updates

## Code Changes Made (Build 94)

### Files Modified:

1. `CompeteApp/screens/ProfileLogged/FormUserEditor.tsx`
   - Added `value={home_state}` prop
   - Removed home_city field completely
2. `CompeteApp/screens/ProfileLogged/ModalProfileEditor.tsx`

   - Fixed import to use correct FormUserEditor

3. `CompeteApp/app.json`
   - Updated to Build 94

## CRITICAL: Database Fix Required

Since Build 94 is deployed but still not saving, you MUST run this SQL script in Supabase:

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**

   - Go to https://supabase.com
   - Select your project

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run This SQL Script**:

```sql
-- Fix RLS policies to allow users to update their own home_state, favorite_player, and favorite_game

-- Drop existing update policy if it's too restrictive
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a comprehensive update policy that allows users to update their own profiles
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure the columns exist and are the correct type
DO $$
BEGIN
    -- Add home_state column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'home_state'
    ) THEN
        ALTER TABLE profiles ADD COLUMN home_state TEXT;
    END IF;

    -- Add favorite_player column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'favorite_player'
    ) THEN
        ALTER TABLE profiles ADD COLUMN favorite_player TEXT;
    END IF;

    -- Add favorite_game column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'favorite_game'
    ) THEN
        ALTER TABLE profiles ADD COLUMN favorite_game TEXT;
    END IF;
END $$;

-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('home_state', 'favorite_player', 'favorite_game')
ORDER BY column_name;
```

4. **Click "Run"** to execute the script

5. **Verify the output** shows the three columns exist

6. **Test the app again**:
   - Force close the app
   - Reopen it
   - Go to Edit Profile
   - Set home state, favorite player, favorite game
   - Click Save
   - Check if values now appear on profile page

## If Still Not Working After Database Fix

If the issue persists after running the SQL script, please check:

1. **In Supabase Dashboard → Table Editor → profiles table**:

   - Do you see the columns: `home_state`, `favorite_player`, `favorite_game`?
   - Try manually editing a row and adding values to these columns
   - If manual edit works, the issue is in the app code
   - If manual edit fails, there's a database permission issue

2. **Check your user's actual data**:

   - In Supabase → Table Editor → profiles
   - Find your user row (username: Tmoneyhill)
   - Check if the columns have any values

3. **Share the results** so I can provide the next fix

## Files Reference

- SQL Fix Script: `CompeteApp/sql/fix_profile_update_rls_for_these_fields.sql`
- Diagnostic Script: `CompeteApp/sql/check_profile_columns_and_policies.sql`
- Form Component: `CompeteApp/screens/ProfileLogged/FormUserEditor.tsx`
- Update Function: `CompeteApp/ApiSupabase/CrudUser.tsx` (UpdateProfile function)
