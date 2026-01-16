# User Status Active/Deleted Implementation Guide

## Overview

This guide documents the implementation of explicit 'active' and 'deleted' status values for user profiles, replacing the previous NULL-based system.

## Problem

Previously, users had:

- `status: null` for active users
- `status: 'deleted'` for deleted users

This caused issues with search functionality because some queries were looking for users with `status = 'active'`, which didn't exist.

## Solution

Implement a proper two-state system:

- `status: 'active'` for active users
- `status: 'deleted'` for deleted users

## Changes Made

### 1. TypeScript Interface Updates

**File:** `CompeteApp/hooks/InterfacesGlobal.tsx`

```typescript
export enum EUserStatus {
  StatusActive = 'active', // NEW: Added active status
  StatusDeleted = 'deleted',
}
```

### 2. Application Code Updates

**File:** `CompeteApp/ApiSupabase/CrudUser.tsx`

#### SignUp Function (Line ~213)

Changed from:

```typescript
status: null,
```

To:

```typescript
status: EUserStatus.StatusActive,
```

#### SignIn Function (Line ~360)

Changed from:

```typescript
.or('status.is.null,status.neq.deleted')
```

To:

```typescript
.or('status.is.null,status.eq.active')
```

This allows login for both NULL (legacy) and 'active' users during the transition period.

### 3. Database Migration Required

**File:** `CompeteApp/sql/add_active_status_to_profiles.sql`

This SQL script will:

1. Add 'active' value to the user_status enum type in PostgreSQL
2. Update all existing NULL status values to 'active'
3. Verify the changes

## Implementation Steps

### Step 1: Apply Database Migration

Run the SQL migration in your Supabase SQL Editor:

```bash
# The SQL file is located at:
CompeteApp/sql/add_active_status_to_profiles.sql
```

**What it does:**

- Adds 'active' to the PostgreSQL enum type
- Updates all users with `status IS NULL` to `status = 'active'`
- Provides verification queries to confirm the changes

### Step 2: Verify Database Changes

After running the migration, verify:

```sql
-- Check status distribution
SELECT
    COALESCE(status::text, 'NULL') as status_value,
    COUNT(*) as count
FROM public.profiles
GROUP BY status
ORDER BY status;
```

Expected result:

- `active`: [count of active users]
- `deleted`: [count of deleted users]
- No NULL values should remain

### Step 3: Test the Changes

1. **Test User Registration:**

   - Create a new user
   - Verify their status is set to 'active' in the database

2. **Test User Search:**

   - Open the "Add Tournament Director" modal
   - Search for users
   - Verify all active users appear in search results

3. **Test User Login:**

   - Login with both username and email
   - Verify login works for users with 'active' status

4. **Test User Deletion:**
   - Delete a user from admin panel
   - Verify their status changes to 'deleted'
   - Verify they no longer appear in search (unless you're an admin with includeDeleted=true)

## Backward Compatibility

The SignIn function includes backward compatibility:

```typescript
.or('status.is.null,status.eq.active')
```

This allows login for:

- Users with `status = 'active'` (new system)
- Users with `status IS NULL` (legacy users not yet migrated)

Once all users are migrated to 'active' status, this can be simplified to:

```typescript
.eq('status', 'active')
```

## Search Functionality

The search in `ModalAssignTournamentDirector` and other components now correctly finds users because:

1. **FetchUsersV2** filters out deleted users:

   ```typescript
   if (!shouldIncludeDeleted) {
     query.not('status', 'eq', EUserStatus.StatusDeleted);
   }
   ```

2. This query will match:
   - Users with `status = 'active'`
   - Users with `status IS NULL` (during transition)
   - But NOT users with `status = 'deleted'`

## Files Modified

1. ✅ `CompeteApp/hooks/InterfacesGlobal.tsx` - Added StatusActive enum
2. ✅ `CompeteApp/ApiSupabase/CrudUser.tsx` - Updated SignUp and SignIn functions
3. ✅ `CompeteApp/sql/add_active_status_to_profiles.sql` - Database migration script

## Next Steps

1. **Apply the SQL migration** in Supabase dashboard
2. **Test the search functionality** to confirm all users appear
3. **Monitor for any issues** with existing users
4. **Consider adding a database constraint** to prevent NULL status values in the future

## Database Constraint (Optional - Future Enhancement)

After confirming all users have been migrated, you can add a NOT NULL constraint:

```sql
-- Make status column NOT NULL with default value
ALTER TABLE public.profiles
ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.profiles
ALTER COLUMN status SET NOT NULL;
```

This ensures all future users will always have a status value.
