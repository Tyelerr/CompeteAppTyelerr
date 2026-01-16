# Build 102 - Giveaway Modal and Winner Picker Fixes

## Issues to Fix

### 1. Giveaway View Modal - Missing Full Details

**Problem:** The giveaway details modal (`ModalViewGiveaway.tsx`) is missing some information that should be displayed.

**Current Fields Shown:**

- Image
- Title
- Prize Value
- Description
- Entries (with info button)
- End Date
- Status

**Missing Fields to Add:**

- Start Date (if applicable)
- Maximum Entries limit
- Terms & Conditions (if applicable)
- Winner information (if giveaway has ended)

### 2. Pick Winner Functionality Error

**Problem:** Error message: "Could not find the function public.fn_pick_random_winners(p_giveaway_id, p_n) in the schema cache"

**Root Cause:**

- The app is trying to call a database function that doesn't exist
- However, `ShopManage.tsx` actually uses client-side random selection
- The error suggests there might be another component trying to call this function

**Solution:**

- The current implementation in `ShopManage.tsx` uses client-side random selection which is fine
- Need to verify if any other components are trying to call the missing database function
- If needed, create the database function for server-side random winner selection

## Implementation Plan

### Phase 1: Enhance Giveaway View Modal

- [x] Analyze current ModalViewGiveaway.tsx
- [ ] Add missing fields to the modal
- [ ] Improve layout and information display
- [ ] Add winner display if giveaway has ended

### Phase 2: Fix Winner Picker

- [x] Analyze ShopManage.tsx pick winner implementation
- [ ] Verify the error source
- [ ] Create SQL function if needed for database-side winner selection
- [ ] Update CrudGiveaway.tsx to include pick winner function
- [ ] Test winner selection functionality

## Files to Modify

1. `CompeteApp/screens/Shop/ModalViewGiveaway.tsx` - Add full details
2. `CompeteApp/ApiSupabase/CrudGiveaway.tsx` - Add pickRandomWinner function
3. `CompeteApp/sql/create_pick_winner_function.sql` - Create database function (if needed)
4. `CompeteApp/screens/Shop/ShopManage.tsx` - Verify/update winner picker logic

## Testing Checklist

- [ ] View giveaway details modal shows all information
- [ ] Pick winner button works without errors
- [ ] Winner is properly selected and saved
- [ ] Winner information displays correctly after selection
- [ ] Entry count updates correctly
