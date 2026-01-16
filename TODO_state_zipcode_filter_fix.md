# State/Zip Code Filter Fix - Progress Tracker

## Issue Description

When selecting a state, the zip code field is not being cleared and the zip code filter continues to take precedence over the state filter, causing incorrect filtering behavior.

## Root Causes Identified

1. **LocationFilters.tsx**: State change handler clears local zip code but doesn't properly update the filters to clear zip_code
2. **CrudTournament.tsx**: Backend filtering logic prioritizes zip_code before state/city, causing zip code to override state selection
3. **Missing mutual exclusivity**: State/city and zip_code filters should be mutually exclusive
4. **Profile zip_code handling**: User's home zip code should only auto-populate when no other location filters are active

## Plan Steps

- [x] **Step 1**: Create progress tracking file
- [ ] **Step 2**: Fix LocationFilters.tsx - Update handlers to ensure mutual exclusivity
- [ ] **Step 3**: Fix CrudTournament.tsx - Modify filtering logic to prioritize state/city over zip_code
- [ ] **Step 4**: Test all scenarios to ensure proper behavior

## Files to Edit

- `CompeteApp/components/LocationFilters/LocationFilters.tsx` - Main location filtering component
- `CompeteApp/ApiSupabase/CrudTournament.tsx` - Backend filtering logic

## Testing Scenarios

- [ ] Test state selection clears zip code properly
- [ ] Test city selection clears zip code properly
- [ ] Test zip code entry clears state/city properly
- [ ] Test profile zip code restoration on reset only
- [ ] Verify filtering works correctly when state is selected
- [ ] Verify filtering works correctly when zip code is entered
- [ ] Verify count matches actual results in all scenarios

## Progress

- [x] Analysis completed
- [x] Plan approved
- [x] LocationFilters.tsx implementation
- [ ] CrudTournament.tsx implementation
- [ ] Testing completed
- [ ] Issue resolved
