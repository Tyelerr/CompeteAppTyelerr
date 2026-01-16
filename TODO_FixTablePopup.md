# Fix Tournament Director Venue Table Popup Issue

## Problem

When a tournament director selects a venue on the submit tournament page, a popup immediately appears saying "no tables configured for this venue" without actually checking if tables exist first. This popup should only appear if there are genuinely no tables configured.

## Root Cause

The "no tables configured" message appears immediately when a venue is selected because it renders while `tableSizeItems.length === 0`, but this happens before `loadVenueTables` completes.

## Solution Steps

- [x] Analyze the issue in LFDropdownTournamentDirectorVenues.tsx
- [x] Add loading state for table data fetching
- [x] Delay warning message until after table loading is complete
- [x] Remove loading message (user feedback: no loading message needed)
- [x] Add timeout protection for loading states
- [x] Fix implemented and ready for testing

## Changes Made

1. Added `loadingTables` and `tablesLoadComplete` state variables
2. Updated `loadVenueTables` function to properly manage loading states
3. Modified `handleVenueChange` to reset loading states when venue changes
4. Updated the "no tables configured" message condition to only show after loading completes
5. Removed the loading message per user request - users only see warnings when tables don't exist

## Files to Edit

- CompeteApp/components/LoginForms/LFDropdownTournamentDirectorVenues.tsx

## Expected Behavior After Fix

1. User selects a venue
2. Loading message appears briefly
3. If tables exist: Show table selection options
4. If no tables exist: Show "no tables configured" message
5. Message should only appear after confirming no tables exist
