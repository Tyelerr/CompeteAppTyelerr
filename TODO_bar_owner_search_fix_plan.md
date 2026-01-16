# Bar Owner Dashboard - Tournament Director Search Fix Plan

## Issue Analysis

Based on the screenshots and code review, the search function in the Bar Owner Dashboard has the following issues:

### Current Behavior:

1. When "Add Tournament Director" modal opens, the search field is empty
2. No users are displayed initially
3. Users must type at least 1 character to trigger the search
4. The search works correctly once triggered, but requires manual input

### Root Cause:

In `ScreenBarOwnerDashboard.tsx`, lines 138-144:

```typescript
useEffect(() => {
  if (search.trim().length > 0) {
    searchUsersFunction();
  } else {
    setSearchUsers([]); // ← This clears results when search is empty
  }
}, [search]);
```

This logic prevents showing any users until the user types something.

## Proposed Solution

### Option 1: Show All Users Initially (Recommended)

Load and display all available users when the modal opens, then filter as the user types.

**Pros:**

- Better UX - users can see available options immediately
- Faster selection - no typing required if user is visible
- Consistent with modern search patterns

**Cons:**

- Slightly more initial data loading
- May show many users if database is large

### Option 2: Add "Search" Button

Keep current behavior but add a button to trigger search.

**Pros:**

- Less initial data loading
- User controls when to search

**Cons:**

- Extra click required
- Less intuitive UX

### Option 3: Lower Character Threshold

Trigger search after 1 character instead of requiring input.

**Pros:**

- Minimal code change

**Cons:**

- Still requires typing
- Doesn't solve the core UX issue

## Recommended Implementation (Option 1)

### Changes Required:

#### 1. Modify `ScreenBarOwnerDashboard.tsx`

**Change the useEffect for modal opening:**

```typescript
useEffect(() => {
  if (showAddDirectorModal) {
    setSearch('');
    setSearchUsers([]);
    setAssigning(null);
    loadVenues();
    // NEW: Load all users initially
    loadAllUsers();
  }
}, [showAddDirectorModal]);
```

**Add new function to load all users:**

```typescript
const loadAllUsers = async () => {
  if (!user) return;

  setSearchLoading(true);
  try {
    const { data } = await FetchUsersV2(
      user as ICAUserData,
      '', // Empty search = all users
      undefined,
      '',
      false,
    );
    const userArray: ICAUserData[] = Array.isArray(data) ? (data as any) : [];
    setSearchUsers(userArray);
  } catch (error) {
    console.error('Error loading users:', error);
    Alert.alert('Error', 'Failed to load users');
  } finally {
    setSearchLoading(false);
  }
};
```

**Modify the search useEffect to filter loaded users:**

```typescript
useEffect(() => {
  if (search.trim().length > 0) {
    searchUsersFunction();
  } else if (showAddDirectorModal) {
    // When search is cleared, reload all users
    loadAllUsers();
  }
}, [search]);
```

#### 2. Optional: Add Pagination or Limit

If there are many users, consider adding:

- Pagination controls
- "Load More" button
- Limit initial results to 50 users
- Virtual scrolling for performance

### Alternative: Simpler Fix

If you want a minimal change, just modify the search trigger:

```typescript
useEffect(() => {
  // Always search, even with empty string
  searchUsersFunction();
}, [search]);

const searchUsersFunction = async () => {
  setSearchLoading(true);
  try {
    const { data } = await FetchUsersV2(
      user as ICAUserData,
      search.trim(), // Will return all users if empty
      undefined,
      '',
      false,
    );
    const userArray: ICAUserData[] = Array.isArray(data) ? (data as any) : [];
    setSearchUsers(userArray);
  } catch (error) {
    console.error('Error searching users:', error);
    Alert.alert('Error', 'Failed to search users');
  } finally {
    setSearchLoading(false);
  }
};
```

## Testing Plan

After implementing the fix:

1. **Initial Load Test:**

   - Open Bar Owner Dashboard
   - Click "Add Tournament Director"
   - ✅ Verify users are displayed immediately (no typing required)

2. **Search Filter Test:**

   - Type a username in the search field
   - ✅ Verify results filter correctly
   - Clear the search field
   - ✅ Verify all users are shown again

3. **Performance Test:**

   - Test with large user database (100+ users)
   - ✅ Verify modal opens quickly
   - ✅ Verify scrolling is smooth

4. **Assignment Test:**
   - Select a user from the list
   - ✅ Verify assignment works correctly
   - ✅ Verify user appears in "My Directors" list

## Database Considerations

The `FetchUsersV2` function already handles:

- ✅ Excluding deleted users
- ✅ Excluding the current user
- ✅ Searching by username, name, and email
- ✅ No role filter (returns all users)

**Potential RLS Issue:**
If users still don't appear, check RLS policies in Supabase:

```sql
-- Run this to verify bar owners can see all profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

If needed, apply the RLS fix from `CompeteApp/sql/fix_tournament_director_search_rls.sql`

## Implementation Priority

**Priority: HIGH**
This is a critical UX issue that prevents bar owners from easily adding tournament directors.

**Estimated Time:** 30 minutes
**Risk Level:** Low (only affects search UX, doesn't change data logic)

## Files to Modify

1. `CompeteApp/screens/BarOwner/ScreenBarOwnerDashboard.tsx` - Main fix
2. `CompeteApp/BUILD_118_SEARCH_FIX.md` - Documentation (create after fix)

## Next Steps

1. Implement Option 1 (recommended) or the simpler alternative
2. Test thoroughly with different user counts
3. Deploy and verify in production
4. Update documentation
