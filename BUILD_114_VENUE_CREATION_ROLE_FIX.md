# Build 114 - Venue Creation Role Case Mismatch Fix

## Build Information

- **Build Number:** 114
- **Version:** 1.0.2
- **Date:** 2024
- **Platform:** iOS & Android

## Critical Bug Fix

### 🐛 Issue: Role Case Mismatch Preventing Venue Creation

**Problem:** Bar owners with role `'bar-admin'` (lowercase with hyphen) could not create venues because the RLS policy was checking for `'BarAdmin'` (PascalCase).

**Root Cause:**

- Database stores roles as: `'bar-admin'`, `'bar-owner'` (lowercase with hyphens)
- RLS policy was checking for: `'BarAdmin'`, `'BarOwner'` (PascalCase)
- Result: Policy rejected all INSERT attempts due to string mismatch

**Impact:** ALL bar owners and bar admins were unable to create venues

### ✅ Solution

Updated RLS policy to use case-insensitive matching (`ILIKE`) and handle multiple role format variations:

- Accepts: `'BarAdmin'`, `'bar-admin'`, `'bar_admin'`
- Accepts: `'BarOwner'`, `'bar-owner'`, `'bar_owner'`
- All comparisons are case-insensitive

## Changes in This Build

### Files Modified

1. **`CompeteApp/app.json`** - Updated build number from 113 to 114
2. **`CompeteApp/screens/Shop/ModalCreateVenue.tsx`** - Added comprehensive debug logging

### Database Changes Required ⚠️

**CRITICAL:** Run this SQL in Supabase Dashboard before deploying:

```sql
-- File: CompeteApp/sql/FIX_ROLE_CASE_MISMATCH.sql

DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;

CREATE POLICY "bar_owners_can_insert_venues" ON venues
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role ILIKE 'BarAdmin'
            OR profiles.role ILIKE 'bar-admin'
            OR profiles.role ILIKE 'bar_admin'
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role ILIKE 'BarOwner'
            OR profiles.role ILIKE 'bar-owner'
            OR profiles.role ILIKE 'bar_owner'
        )
        AND profiles.id_auto = venues.barowner_id
    )
);
```

## Testing Checklist

### Before Deployment

- [ ] Run SQL fix in Supabase Dashboard
- [ ] Verify policy was created successfully
- [ ] Check that policy uses ILIKE for case-insensitive matching

### After Deployment

- [ ] Log in as user with `'bar-admin'` role
- [ ] Navigate to Bar Owner Dashboard → My Venues
- [ ] Click "Add Venue"
- [ ] Fill in venue details and submit
- [ ] Verify venue is created successfully
- [ ] Verify venue appears in "My Venues" list
- [ ] Test with user with `'bar-owner'` role (if available)

## Deployment Steps

1. **Apply SQL Fix** ⚠️ (REQUIRED FIRST)

   ```
   Run: CompeteApp/sql/FIX_ROLE_CASE_MISMATCH.sql in Supabase Dashboard
   ```

2. **Update Build Number** ✅ (Completed - now 114)

3. **Build & Deploy:**

   ```bash
   cd CompeteApp
   eas build --platform ios --profile production
   eas submit --platform ios --profile production
   ```

4. **Test Venue Creation** (After deployment)

## Debug Logging Added

The modal now logs:

- `barownerId` value and type
- Complete venue data being sent to API
- Success/failure status
- Detailed error messages

View logs in browser console (F12) when testing locally or in development builds.

## Success Criteria

✅ Users with `'bar-admin'` role can create venues
✅ Users with `'bar-owner'` role can create venues  
✅ Users with `'BarAdmin'` role can create venues (backward compatible)
✅ Users with `'BarOwner'` role can create venues (backward compatible)
✅ Created venues appear in "My Venues" list
✅ No role case sensitivity issues

## Related Issues

- Build 112: Initial venue creation issue identified
- Build 113: First RLS policy fix attempt (case-sensitive)
- Build 114: Role case mismatch fix (case-insensitive)

## Files Created/Modified

- `CompeteApp/sql/FIX_ROLE_CASE_MISMATCH.sql` - THE REAL FIX
- `CompeteApp/sql/DIAGNOSE_EVERYTHING.sql` - Comprehensive diagnostic
- `CompeteApp/screens/Shop/ModalCreateVenue.tsx` - Added debug logging
- `CompeteApp/app.json` - Build number updated to 114
- `CompeteApp/BUILD_114_VENUE_CREATION_ROLE_FIX.md` - This file

## Rollback Plan

If issues occur, revert the policy:

```sql
DROP POLICY IF EXISTS "bar_owners_can_insert_venues" ON venues CASCADE;
-- Then restore from backup or use previous version
```

## Support Resources

- SQL Fix: `CompeteApp/sql/FIX_ROLE_CASE_MISMATCH.sql`
- Diagnostic: `CompeteApp/sql/DIAGNOSE_EVERYTHING.sql`
- Full guide: `CompeteApp/VENUE_CREATION_BAROWNER_FIX_PLAN.md`
