# BUILD 159: Bar Owner Tournament Director Search Fix + Auto-Active Status

## 🐛 Issues Found

### Issue 1: Bar Owner TD Search Not Showing All Users

When assigning a tournament director from the **Bar Owner Dashboard**, the search modal was **not displaying all users**. Users reported that the search "used to work" but now shows fewer results.

### Issue 2: New Users Not Set to Active Status

When creating users (both admin-created and self-registered), the status was not being set to `'active'`, causing them to not appear in search results.

### Root Causes

**Issue 1:** In `FetchUsersV2` function (`CrudUser.tsx`), the query filters out deleted users but **does NOT explicitly include active users or users with null status**.

The old code (lines 247-252):

```typescript
const shouldIncludeDeleted =
  includeDeleted ||
  loggedUser.role === EUserRole.MasterAdministrator ||
  loggedUser.role === EUserRole.CompeteAdmin;
if (!shouldIncludeDeleted) {
  query.not('status', 'eq', EUserStatus.StatusDeleted);
}
```

This only excludes `status = 'deleted'`, but doesn't account for:

- Users with `status = 'active'` ✅ (should show)
- Users with `status = null` ✅ (should show - legacy users)
- Users with other statuses ❌ (might be hidden)

**Issue 2:** Both `AdminCreateUser` and `ModalCreateUser` were not setting the status to `'active'` when creating new users.

## ✅ Fixes Applied

### Fix 1: Updated User Search Filter - `CompeteApp/ApiSupabase/CrudUser.tsx`

**Updated the status filtering logic in `FetchUsersV2` function:**

```typescript
// Filter by status - show active users and users with null status (legacy)
const shouldIncludeDeleted =
  includeDeleted ||
  loggedUser.role === EUserRole.MasterAdministrator ||
  loggedUser.role === EUserRole.CompeteAdmin;

if (!shouldIncludeDeleted) {
  // Show only active users OR users with null status (legacy users)
  query.or('status.is.null,status.eq.active');
}
```

### Fix 2: Auto-Set Active Status for Admin-Created Users

**File Modified: `CompeteApp/ApiSupabase/AdminAuthHelpers.ts`**

Changed from:

```typescript
status: null,
```

To:

```typescript
status: EUserStatus.StatusActive, // FIXED: Set status to 'active' for admin-created users
```

**File Modified: `CompeteApp/screens/Admin/ModalCreateUser.tsx`**

Added to profile updates:

```typescript
const profileUpdates: Partial<ICAUserData> = {
  home_state: homeState.trim(),
  status: EUserStatus.StatusActive, // FIXED: Ensure admin-created users are set to active status
};
```

Also added import:

```typescript
import {
  EUserRole,
  UserRoles,
  ICAUserData,
  EUserStatus, // Added
} from '../../hooks/InterfacesGlobal';
```

### Fix 3: Self-Registered Users Already Set to Active

**Note:** The `SignUp` function in `CrudUser.tsx` already correctly sets `status: EUserStatus.StatusActive` (line 367), so no changes were needed there.

## 🔄 How It Works Now

### User Search:

When searching for users in the Bar Owner Dashboard:

1. **Bar Owner searches** → Opens `ModalAssignTournamentDirector`
2. **Types 3+ characters** → Calls `FetchUsersV2` with `includeDeleted: false`
3. **Query filters users:**
   - ✅ Shows users with `status = 'active'`
   - ✅ Shows users with `status = null` (legacy users without status set)
   - ❌ Hides users with `status = 'deleted'`
4. **Displays results** → All active and legacy users appear in search

### User Creation:

- **Admin creates user** → Status automatically set to `'active'` ✅
- **User self-registers** → Status automatically set to `'active'` ✅
- **All new users** → Immediately visible in search results ✅

## 🎯 Expected Behavior

### Search Results:

- **Active Users** → ✅ Visible in search
- **Legacy Users (null status)** → ✅ Visible in search
- **Deleted Users** → ❌ Hidden from search
- **Master Admin/Compete Admin** → ✅ Can see all users including deleted (if `includeDeleted = true`)

### New User Creation:

- **Admin creates user** → Status = `'active'` ✅
- **User signs up** → Status = `'active'` ✅
- **New users appear in search immediately** → ✅

## 📝 Testing Instructions

### Test 1: Bar Owner TD Search

1. Log in as a **Bar Owner**
2. Go to **Bar Owner Dashboard**
3. Click **"Add New Tournament Director"** button
4. Select a venue (if you have multiple)
5. In the search modal, type a username (3+ characters)
6. **Verify:** All active users and legacy users appear in results
7. **Verify:** Deleted users do NOT appear in results
8. **Verify:** You can successfully assign a tournament director

### Test 2: Admin User Creation

1. Log in as **Compete Admin**
2. Go to **Admin Dashboard** → **Users** tab
3. Click **"+ User"** button
4. Fill in user details and create a new user
5. **Verify:** New user appears in the users list immediately
6. **Verify:** New user has "Active" status
7. **Verify:** New user appears in Bar Owner TD search

### Test 3: Self-Registration

1. Log out
2. Click **"Sign Up"** on login screen
3. Create a new account
4. **Verify:** Account is created successfully
5. Log in as admin and check the new user
6. **Verify:** New user has "Active" status
7. **Verify:** New user appears in search results

## ✅ Fixes Complete

All fixes have been successfully implemented:

1. ✅ Tournament director search displays all active and legacy users
2. ✅ Admin-created users automatically set to active status
3. ✅ Self-registered users automatically set to active status (already working)
4. ✅ All new users immediately visible in search results
