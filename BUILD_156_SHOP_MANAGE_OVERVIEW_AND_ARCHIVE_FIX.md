# BUILD 156 - Shop Manage Overview Display & Archive Functionality Fix

## Date

January 2025

## Build Number

- iOS: 156
- Android: 156

## Issues Fixed

### Issue 1: Overview Section Not Displaying Current Information

**Problem:** The Overview section in the Shop → Manage tab was showing all zeros for:

- Active Giveaways: 0
- Total Entries: 0
- Total Prize Value: $0

Even though there were active giveaways with entries in the database.

**Root Cause:**
The `ShopManage.tsx` component was querying the `giveaways` table directly and hardcoding `entriesCount: 0` instead of using the database view that includes real-time entry counting.

**Solution:**

- Updated `api.list()` function to query `v_giveaways_with_counts` view instead of `giveaways` table
- Changed from hardcoded `entriesCount: 0` to `entriesCount: item.entries_count || 0`
- Added `numeric_id` field to `RawGiveaway` interface for consistency

### Issue 2: Archived Status Not Working in Edit Giveaway Modal

**Problem:** When changing a giveaway's status to "archived" in the Edit Giveaway modal:

- The status would update in the database
- But the giveaway and its entries were NOT moved to archive tables
- The giveaway remained in the active `giveaways` table

**Root Cause:**
The `onSave` callback in `ScreenShop.tsx` was treating "archived" status like any other status update, just updating the field instead of calling the proper archival function.

**Solution:**

- Added conditional logic in the `onSave` callback to detect when status is changed to "archived"
- When "archived" is selected, it now calls `archiveGiveaway()` function which:
  - Moves the giveaway to `giveaways_archive` table
  - Moves all associated entries to `giveaway_entries_archive` table
  - Deletes the giveaway and entries from active tables
  - Logs the admin user ID for audit trail
- For other status changes, continues to update normally

## Files Modified

### 1. CompeteApp/screens/Shop/ShopManage.tsx

**Changes:**

- Line 28: Added `numeric_id?: number` to `RawGiveaway` interface
- Lines 73-92: Updated `api.list()` to query `v_giveaways_with_counts` view
- Line 87: Changed from `entriesCount: 0` to `entriesCount: item.entries_count || 0`

### 2. CompeteApp/screens/Shop/ScreenShop.tsx

**Changes:**

- Lines 1070-1110: Updated `onSave` callback in ModalEditGiveaway
- Added conditional logic to handle "archived" status specially
- Calls `archiveGiveaway()` function when status is "archived"
- Maintains normal update flow for other status changes

### 3. CompeteApp/app.json

**Changes:**

- iOS buildNumber: 155 → 156
- Android versionCode: 155 → 156

## Technical Details

### Database View Used

The fix leverages the existing `v_giveaways_with_counts` view which includes:

- Real-time entry counting via subquery
- All giveaway fields including `entries_count`
- Proper filtering to exclude archived giveaways

### Archival Function Used

The fix uses the existing `archive_giveaway_manual()` database function which:

- Uses SECURITY DEFINER to bypass RLS policies
- Archives giveaway to `giveaways_archive` table
- Archives all entries to `giveaway_entries_archive` table
- Deletes from active tables
- Logs removal date, reason, and admin user ID

## Expected Behavior After Fix

### Overview Section

- **Active Giveaways:** Shows correct count of giveaways with status='active'
- **Total Entries:** Shows sum of all entries across all active giveaways
- **Total Prize Value:** Shows sum of all prize values from active giveaways

### Archive Functionality

When changing a giveaway's status to "archived" in Edit Giveaway modal:

1. Success alert appears: "Giveaway has been archived successfully."
2. Giveaway is moved to `giveaways_archive` table
3. All entries are moved to `giveaway_entries_archive` table
4. Giveaway disappears from the manage list
5. Overview counts update immediately

## Testing Recommendations

1. **Test Overview Display:**

   - Navigate to Shop → Manage tab
   - Verify Overview section shows correct counts
   - Create a new giveaway and verify counts update
   - Have someone enter a giveaway and verify Total Entries increments

2. **Test Archive Functionality:**

   - Edit an existing giveaway
   - Change status to "Archived"
   - Save changes
   - Verify success message appears
   - Verify giveaway disappears from list
   - Check database to confirm giveaway is in `giveaways_archive`
   - Check database to confirm entries are in `giveaway_entries_archive`

3. **Test Other Status Changes:**
   - Edit a giveaway
   - Change status to "Active", "Ended", or "Awarded"
   - Verify normal update works correctly
   - Verify giveaway remains in active list

## Database Requirements

**No database changes required** - this fix uses existing infrastructure:

- ✅ `v_giveaways_with_counts` view (already exists)
- ✅ `archive_giveaway_manual()` function (already exists)
- ✅ `giveaways_archive` table (already exists)
- ✅ `giveaway_entries_archive` table (already exists)

## Deployment Notes

This is a code-only fix that requires:

1. Build number increment (155 → 156)
2. App rebuild and deployment
3. No database migrations needed
4. No environment variable changes needed

## Related Documentation

- `CompeteApp/sql/giveaway_archival_functions.sql` - Archival function definitions
- `CompeteApp/sql/FIX_v_giveaways_with_counts_realtime.sql` - View definition
- `CompeteApp/ApiSupabase/CrudGiveaway.tsx` - Giveaway CRUD operations

## Status

✅ **COMPLETE** - Ready for deployment as Build 156
