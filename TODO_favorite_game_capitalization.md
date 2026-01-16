# Favorite Game Capitalization Enhancement

## Goal

Ensure that favorite game entries are properly capitalized with each word having its first letter capitalized, handling special cases like numbers and billiard game names.

## Examples

- "9 ball" → "9 Ball"
- "one pocket" → "One Pocket"
- "straight pool" → "Straight Pool"
- "8 ball" → "8 Ball"
- "10 ball" → "10 Ball"

## Tasks

- [x] Create enhanced capitalization function in hooks/hooks.tsx
- [x] Update LFInput component to support capitalizeGameName prop
- [x] Update FormUserEditor_NoCityField.tsx to use enhanced capitalization
- [x] Apply capitalization in onChangeText for real-time feedback
- [x] Apply capitalization before saving to database
- [x] Test the implementation - All 15 tests passed! ✅
- [ ] Update other FormUserEditor files if needed for consistency

## Test Results

✅ All 15 test cases passed successfully!

- Numbers are preserved: "9 ball" → "9 Ball"
- Proper title case: "one pocket" → "One Pocket"
- Handles various formats: "STRAIGHT POOL" → "Straight Pool"
- Edge cases work: empty strings, whitespace, mixed case

## Implementation Details

✅ **Enhanced Function**: Created `CapitalizeGameName` function that preserves numbers
✅ **Component Support**: Added `capitalizeGameName` prop to LFInput component
✅ **Real-time Capitalization**: Users see capitalization as they type
✅ **Database Persistence**: Capitalized values are saved to database
✅ **Comprehensive Testing**: All edge cases covered and verified

## Implementation Plan

1. Add `CapitalizeGameName` function to hooks/hooks.tsx
2. Update the favorite game input handling in form components
3. Ensure proper capitalization on blur and form submission
