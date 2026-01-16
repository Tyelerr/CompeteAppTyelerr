# BUILD 158: Admin Tournament Director Assignment Role Fix

## 🐛 Issue Found

When adding a tournament director from the **Admin Users screen**, the user's role was NOT being updated to `'tournament-director'`. Instead, they remained as `'basic'` user even though they were assigned to a venue as a TD.

### Root Cause

In `ScreenAdminUsers.tsx`, the `handleAssignTD` function was:

1. ✅ Correctly calling `assignTournamentDirectorToVenue()` to add the user to the venue
2. ❌ **NOT updating the user's role** from `'basic'` to `'tournament-director'`

This was different from the Bar Owner flow (`ModalAssignTournamentDirector.tsx`), which correctly updates the role.

## ✅ Fix Applied

### File Modified: `CompeteApp/screens/Admin/ScreenAdminUsers.tsx`

**Added role upgrade logic in `handleAssignTD` function:**

```typescript
// CRITICAL FIX: Update user's role to Tournament Director if they're a Basic User
if (selectedTD.role === EUserRole.BasicUser) {
  console.log('Upgrading user role from Basic to Tournament Director');
  const roleUpdateResult = await UpdateProfile(selectedTD.id, {
    role: EUserRole.TournamentDirector,
  });

  if (!roleUpdateResult.success) {
    showInfoModal('Error', 'Failed to update user role to Tournament Director');
    return;
  }
}
```

**Also updated success message to indicate role upgrade:**

```typescript
showInfoModal(
  'Success',
  `Tournament Director assigned to ${userVenues[0].venue} successfully${
    selectedTD.role === EUserRole.BasicUser
      ? '. Their role has been upgraded to Tournament Director.'
      : ''
  }`,
);
```

## 🔄 How It Works Now

When you click "Add Tournament Director" from the Admin Users screen:

1. **Search for user** → Opens search modal
2. **Select user** → Finds the user in the list
3. **Check current role:**
   - If `'basic'` → **Upgrades to `'tournament-director'`** ✅
   - If already `'tournament-director'` → Keeps role, just adds venue
   - If `'bar-admin'` → Keeps role, adds TD access to venue
4. **Assign to venue** → Adds user to the venue's TD list
5. **Show success** → Displays confirmation with role upgrade message if applicable

## 🎯 Expected Behavior

- **Basic User** → Assigned as TD → Role becomes `'tournament-director'` ✅
- **Tournament Director** → Assigned to another venue → Role stays `'tournament-director'` ✅
- **Bar Admin** → Assigned as TD → Role stays `'bar-admin'` (dual role) ✅

## 📝 Testing Instructions

1. Go to **Admin Dashboard** → **Users** tab
2. Find a **Bar Admin** user (e.g., "metrosportzbar")
3. Click **"Add Tournament Director"** button
4. Search for a **Basic User** (e.g., "TD1")
5. Select the user
6. **Verify:** User's role should now be `'tournament-director'` instead of `'basic'`
7. **Verify:** User should appear with "Tournament Director" badge in the admin dashboard

## ✅ Fix Complete

The tournament director assignment from the admin dashboard now correctly upgrades Basic Users to Tournament Director role, matching the behavior of the Bar Owner dashboard flow.
