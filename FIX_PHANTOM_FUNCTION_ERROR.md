# Fix: Phantom Database Function Error

**Issue:** Error message appearing: "Could not find the function public.fn_pick_random_winners(p_giveaway_id, p_n) in the schema cache"

**Date:** 2025  
**Status:** Solution Ready

---

## Problem Analysis

### What's Happening

The error is appearing because there's a **phantom reference** to an old database function `fn_pick_random_winners` that was created during initial development but is **no longer used** by the application.

### Key Facts

1. **The app does NOT call this function** - Looking at `ShopManage.tsx`, the winner selection is done client-side using JavaScript's `Math.random()` (lines 233-244)
2. **The function exists in the database** - It was likely created during initial setup
3. **Supabase is caching the function** - The schema cache is referencing this old function
4. **This is a known issue** - BUILD_102 documentation notes: "The error message about `fn_pick_random_winners` database function was a red herring - the app doesn't actually call this function"

### Current Implementation

The app uses **client-side random selection**:

```typescript
const pick = async () => {
  if (!entries.length) return;

  // Generate random entry number between 1 and total entries
  const randomEntryNumber = Math.floor(Math.random() * entries.length) + 1;

  // Find entry with this number
  const winner =
    entries.find((e: any) => e.entry_number === randomEntryNumber) ||
    entries[randomEntryNumber - 1];

  if (winner) {
    setPickedEntryNumber(randomEntryNumber);
    setPicked(winner);
    await onPicked(winner);
  }
};
```

---

## Solution

### Step 1: Drop the Old Function from Supabase

You need to run the SQL script to remove this phantom function from your database.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `CompeteApp/sql/drop_fn_pick_random_winners.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

**Option B: Via Supabase CLI**

```bash
cd CompeteApp
supabase db push --file sql/drop_fn_pick_random_winners.sql
```

### Step 2: Clear Supabase Schema Cache

After dropping the function, you may need to clear the schema cache:

**Via Supabase Dashboard:**

1. Go to **Database** → **Functions**
2. Verify `fn_pick_random_winners` is no longer listed
3. If it still appears, refresh the page
4. Go to **Settings** → **API** → Click **Refresh Schema Cache**

**Via API (if needed):**

```bash
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/refresh_schema_cache' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Step 3: Test the Fix

1. Close and restart your app
2. Navigate to **Shop** → **Manage** tab
3. Click **Pick Winner** on an active giveaway
4. Verify the error no longer appears
5. Confirm winner selection works correctly

---

## Why This Happened

### Initial Setup (Old Approach)

During initial development, a database function was likely created to handle random winner selection server-side:

```sql
CREATE OR REPLACE FUNCTION public.fn_pick_random_winners(
  p_giveaway_id uuid,
  p_n integer
)
RETURNS TABLE(entry_id uuid, user_id uuid, name text, email text)
AS $$
  -- Server-side random selection logic
$$ LANGUAGE plpgsql;
```

### Current Approach (Better)

The app was later refactored to use **client-side random selection** because:

1. **Simpler** - No need for complex database functions
2. **More flexible** - Easy to modify selection logic
3. **Better UX** - Can show animation/effects during selection
4. **Easier to debug** - Logic is in TypeScript, not SQL

However, the old function was never properly removed from the database, causing this phantom error.

---

## Verification

After applying the fix, verify:

- [ ] Error no longer appears when clicking "Pick Winner"
- [ ] Winner selection works correctly
- [ ] Entry numbers are displayed properly
- [ ] Winner information shows correctly (name, email)
- [ ] Giveaway status updates to "ended" after picking winner

---

## Related Files

- `CompeteApp/screens/Shop/ShopManage.tsx` - Current winner selection implementation
- `CompeteApp/sql/drop_fn_pick_random_winners.sql` - SQL script to drop the function
- `CompeteApp/BUILD_102_GIVEAWAY_FIXES_COMPLETE.md` - Previous documentation noting this issue

---

## Prevention

To prevent similar issues in the future:

1. **Document database changes** - Keep track of all database functions/triggers created
2. **Clean up old code** - When refactoring, remove old database objects
3. **Use migrations** - Track database changes with migration files
4. **Regular audits** - Periodically review database functions and remove unused ones

---

## Additional Notes

- This is a **non-breaking issue** - The app works fine, just shows an error message
- The error appears because Supabase is trying to validate all functions in the schema cache
- No code changes are needed - only database cleanup
- This fix is safe and won't affect any other functionality

---

## Support

If you continue to see the error after applying this fix:

1. Check Supabase logs for any related errors
2. Verify the function was actually dropped (check Database → Functions)
3. Try clearing browser cache and restarting the app
4. Check if there are any other variations of the function name in the database
