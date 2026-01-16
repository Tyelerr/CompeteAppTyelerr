# ZIP Code Filter Fix - Progress Tracker

## Issue Description

When applying zip code filter in billiard tournaments, the count immediately changes to 0 even when there should be matching tournaments.

## Root Causes Identified

1. **Count Query Mismatch**: Count query doesn't properly handle venue-based filtering when zip codes are used
2. **Venue ID Filtering Logic**: When zip coordinates are found, main query filters by venue location but count query doesn't account for this properly
3. **Fallback Logic Issues**: Fallback to exact zip code matching has inconsistencies between main query and count query

## Plan Steps

- [ ] **Step 1**: Fix Count Query Logic - Ensure count query matches main query filtering exactly for zip code scenarios
- [ ] **Step 2**: Improve Venue ID Collection - Fix the venue ID collection logic for location-based filtering
- [ ] **Step 3**: Standardize Fallback Logic - Make sure both queries use the same fallback approach
- [ ] **Step 4**: Add Better Error Handling - Add logging and error handling for debugging

## Files to Edit

- `CompeteApp/ApiSupabase/CrudTournament.tsx` - Main filtering logic

## Testing Scenarios

- [ ] Test zip code with coordinates in zip_codes table
- [ ] Test zip code with coordinates in venues table only
- [ ] Test zip code requiring Geoapify lookup
- [ ] Test zip code with no coordinates found (fallback to exact match)
- [ ] Verify count matches actual results in all scenarios

## Progress

- [x] Analysis completed
- [x] Plan approved
- [ ] Implementation started
- [ ] Testing completed
- [ ] Issue resolved
