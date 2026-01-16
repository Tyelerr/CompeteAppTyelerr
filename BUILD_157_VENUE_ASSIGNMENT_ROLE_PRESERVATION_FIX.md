# BUILD 157: Fix User Role Change When Assigning Venue

## Problem

When adding a venue to user "metrosportzbar" with the "Bar Owner" role (BarAdmin), the user's role is being changed to "Basic User". This is a critical bug that affects user permissions.

## Root Cause Analysis

After analyzing the code, the issue is **NOT** in the application layer:

- `CrudVenues.tsx` - `assignVenueToUser()` function only updates the `venues` table's `barowner_id` field
- `ModalCreateVenue.tsx` - Only creates venues with `barowner_id`, doesn't touch user roles
- `ScreenAdminUsers.tsx` - Calls `assignVenueToUser()` correctly

The problem is in the **DATABASE LAYER** - likely one of these:

1. **Database Trigger**: A trigger on the `venues` table that fires on INSERT/UPDATE and incorrectly modifies the `profiles` table
2. **RLS Policy**: An overly restrictive or incorrectly written RLS policy that's causing role changes
3. **Database Function**: A function that's being called during venue assignment that modifies user roles

## Investigation Steps

### Step 1: Check for Database Triggers

```sql
-- Check for triggers on venues table
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'venues'
ORDER BY trigger_name;

-- Check for triggers on profiles table that might be related
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
AND (action_statement LIKE '%venue%' OR action_statement LIKE '%barowner%')
ORDER BY trigger_name;
```

### Step 2: Check RLS Policies on Profiles Table

```sql
-- Check all RLS policies on profiles table
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
WHERE tablename = 'profiles'
ORDER BY policyname;
```

### Step 3: Check for Functions That Modify User Roles

```sql
-- Search for functions that update profiles.role
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_definition LIKE '%UPDATE%profiles%role%'
ORDER BY routine_name;
```

### Step 4: Check Current User Role

```sql
-- Check the current role of the affected user
SELECT
    id,
    id_auto,
    email,
    user_name,
    role,
    created_at,
    updated_at
FROM profiles
WHERE user_name = 'metrosportzbar' OR email LIKE '%metrosportz%';
```

## Solution

### Fix 1: Ensure No Triggers Are Modifying User Roles

If any triggers are found that modify user roles during venue operations, they need to be removed or fixed:

```sql
-- Drop any problematic triggers (example)
DROP TRIGGER IF EXISTS trigger_name_here ON venues;
DROP TRIGGER IF EXISTS trigger_name_here ON profiles;
```

### Fix 2: Verify RLS Policies Don't Cause Role Changes

The RLS policies should ONLY control access, not modify data. If any policies are found that modify roles, they need to be rewritten.

### Fix 3: Restore User's Correct Role

```sql
-- Restore the user's role to BarAdmin
UPDATE profiles
SET role = 'BarAdmin'
WHERE user_name = 'metrosportzbar' OR email LIKE '%metrosportz%';

-- Verify the change
SELECT
    id_auto,
    email,
    user_name,
    role
FROM profiles
WHERE user_name = 'metrosportzbar' OR email LIKE '%metrosportz%';
```

### Fix 4: Add Safeguard to Prevent Future Role Changes

Create a trigger that prevents unauthorized role changes:

```sql
-- Create a function to prevent unauthorized role downgrades
CREATE OR REPLACE FUNCTION prevent_role_downgrade()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is being changed from BarAdmin to BasicUser, prevent it
    IF OLD.role IN ('BarAdmin', 'MasterAdministrator', 'CompeteAdmin')
       AND NEW.role = 'BasicUser'
       AND current_setting('app.allow_role_change', true) IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'Cannot downgrade role from % to % without explicit permission', OLD.role, NEW.role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent role downgrades
DROP TRIGGER IF EXISTS trigger_prevent_role_downgrade ON profiles;
CREATE TRIGGER trigger_prevent_role_downgrade
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION prevent_role_downgrade();
```

## Testing Plan

1. **Restore User Role**: First, restore metrosportzbar's role to BarAdmin
2. **Test Venue Assignment**: Assign a venue to the user and verify role doesn't change
3. **Test Venue Creation**: Create a new venue for the user and verify role doesn't change
4. **Monitor Logs**: Check database logs for any errors or warnings

## Deployment Steps

1. Run investigation SQL queries to identify the root cause
2. Apply the appropriate fix based on findings
3. Restore user's role to BarAdmin
4. Test venue assignment functionality
5. Deploy safeguard trigger to prevent future issues

## Files to Check

- `CompeteApp/sql/fix_venue_creation_rls.sql` - Previous RLS fixes
- `CompeteApp/sql/fix_venue_creation_barowner_final.sql` - Latest venue creation fix
- `CompeteApp/sql/fix_venues_td_assignment_rls.sql` - TD assignment RLS
- Any custom database functions or triggers

## Notes

- This is a **CRITICAL BUG** that affects user permissions
- The issue is in the database layer, not the application code
- Need to investigate database triggers, RLS policies, and functions
- A safeguard trigger should be added to prevent future unauthorized role changes
