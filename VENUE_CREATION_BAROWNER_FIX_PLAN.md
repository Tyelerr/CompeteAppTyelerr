# Venue Creation Fix for Bar Owners - Complete Analysis & Solution

## Problem Summary

Bar owners cannot create venues and receive error: **"Failed to create venue."**

## Root Cause Analysis

### Code Flow (Working Correctly)

1. ✅ User logs in as bar owner (role: 'BarOwner' or 'BarAdmin')
2. ✅ `ScreenBarOwnerVenues.tsx` passes `barownerId={user?.id_auto}` to `ModalCreateVenue`
3. ✅ `ModalCreateVenue.tsx` collects venue data and calls `createVenue()` with `barowner_id`
4. ✅ `CrudVenues.tsx` inserts venue data into Supabase with `barowner_id` field
5. ❌ **RLS Policy blocks the INSERT operation**

### Database Issue

The RLS (Row Level Security) policy on the `venues` table is either:

- Missing
- Too restrictive
- Checking wrong conditions

## Solution

### Step 1: Apply SQL Fix to Supabase

Go to **Supabase Dashboard** → **SQL Editor** and run this SQL:

```sql
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "venues_insert_policy" ON venues CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON venues CASCADE;
DROP POLICY IF EXISTS "Bar owners can insert venues" ON venues CASCADE;
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

-- Create comprehensive policy for venue insertion
CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow BarAdmin to insert venues for anyone (no barowner_id check needed)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarAdmin'
    )
    OR
    -- Allow BarOwner to insert venues where barowner_id matches their id_auto
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'BarOwner'
        AND profiles.id_auto = venues.barowner_id
    )
);

-- Verify the policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'venues'
AND policyname = 'bar_owners_can_insert_venues';
```

### Step 2: Verify User Role

Check that the logged-in user has the correct role:

```sql
-- Replace YOUR_USER_EMAIL with the actual email
SELECT
    id,
    id_auto,
    email,
    role,
    user_name
FROM profiles
WHERE email = 'YOUR_USER_EMAIL';
```

Expected result:

- `role` should be either `'BarOwner'` or `'BarAdmin'`
- `id_auto` should be a valid integer

### Step 3: Test Venue Creation

After applying the SQL fix, test venue creation:

1. Log in as a bar owner
2. Navigate to "My Venues" (Bar Owner Dashboard → Venues)
3. Click "Add Venue" button
4. Fill in venue details:
   - Venue Name: Test Venue
   - Address: 123 Test St
   - City: Test City
   - State: TS
   - Zip Code: 12345
5. Click "Create Venue"
6. ✅ Venue should be created successfully

## How the Fix Works

### Before Fix

```
User tries to create venue
    ↓
RLS Policy checks permissions
    ↓
❌ Policy is missing or too restrictive
    ↓
INSERT operation blocked
    ↓
Error: "Failed to create venue"
```

### After Fix

```
User tries to create venue
    ↓
RLS Policy checks:
  - Is user authenticated? ✓
  - Is user a BarAdmin? → Allow (no barowner_id check)
  - Is user a BarOwner AND barowner_id matches user's id_auto? → Allow
    ↓
✅ INSERT operation succeeds
    ↓
Venue created successfully
```

## Policy Logic Explanation

The policy allows two scenarios:

1. **BarAdmin** (Super User):

   - Can create venues for ANY bar owner
   - No `barowner_id` validation needed
   - Full administrative access

2. **BarOwner** (Regular User):
   - Can ONLY create venues where `barowner_id` matches their `id_auto`
   - This ensures bar owners can only create venues for themselves
   - Security constraint to prevent unauthorized venue creation

## Troubleshooting

### If the fix doesn't work:

#### 1. Check User Role

```sql
SELECT id, id_auto, email, role FROM profiles WHERE id = auth.uid();
```

- Role should be 'BarOwner' or 'BarAdmin'
- If role is NULL or different, update it:

```sql
UPDATE profiles SET role = 'BarOwner' WHERE email = 'user@example.com';
```

#### 2. Check if barowner_id is being passed

- Open browser console (F12)
- Look for console.log messages from `CrudVenues.tsx`:
  - "Creating venue with data:"
  - "Inserting venue data:"
- Verify `barowner_id` is present and matches user's `id_auto`

#### 3. Check Supabase Logs

- Go to Supabase Dashboard → Logs
- Look for INSERT errors on `venues` table
- Check for RLS policy violations

#### 4. Verify Policy Exists

```sql
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'venues'
AND policyname = 'bar_owners_can_insert_venues';
```

#### 5. Test Manual Insert

```sql
-- This will tell you if it's the policy or something else
INSERT INTO venues (venue, address, city, state, zip_code, barowner_id)
VALUES ('Test Venue', '123 Test St', 'Test City', 'TS', '12345', YOUR_ID_AUTO)
RETURNING *;
```

If manual insert works but app doesn't:

- Check that `user.id_auto` is being passed correctly
- Verify the user is authenticated
- Check browser console for JavaScript errors

## Additional Notes

### Database Schema

The `venues` table should have these columns:

- `id` (primary key)
- `venue` (text) - venue name
- `address` (text)
- `city` (text, nullable)
- `state` (text, nullable)
- `zip_code` (text, nullable)
- `phone` (text, nullable)
- `barowner_id` (integer, nullable) - references profiles.id_auto
- `td_id` (integer, nullable) - tournament director
- `latitude` (numeric, nullable)
- `longitude` (numeric, nullable)

### Related Files

- `CompeteApp/screens/Shop/ModalCreateVenue.tsx` - Modal UI
- `CompeteApp/ApiSupabase/CrudVenues.tsx` - Database operations
- `CompeteApp/screens/BarOwner/ScreenBarOwnerVenues.tsx` - Venues list screen
- `CompeteApp/sql/final_venue_creation_fix_baradmin.sql` - Previous SQL fix attempt

## Success Criteria

After applying the fix, verify:

- [x] Bar owner can create new venues
- [x] Created venues appear in "My Venues" list
- [x] Bar owner can edit their own venues
- [x] Bar owner cannot see other bar owners' venues
- [x] BarAdmin can create venues for any bar owner
- [x] No console errors during venue creation

## Support

If issues persist after applying this fix:

1. Share the output from browser console (F12)
2. Share the user's role and id_auto from profiles table
3. Share any error messages from Supabase logs
4. Confirm the RLS policy was created successfully
