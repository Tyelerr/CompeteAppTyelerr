# Date Range Picker Styling Fix

## Problem

The date range picker in the tournament filters modal is working functionally but is extremely dark and hard to see/read.

## Root Cause

- The DateTimePicker component uses `BaseColors.secondary` (#27272a) as background color
- This makes the picker nearly invisible against the dark theme
- Poor contrast between picker elements and background

## Plan

- [x] Analyze current styling issues
- [x] Fix DateTimePicker background styling
- [x] Improve input button contrast
- [x] Add platform-specific styling adjustments
- [x] Remove separate dropdown boxes below input fields
- [x] Ensure selected dates appear directly in input fields
- [x] Implement calendar-style date picker display
- [x] Complete functionality and styling fix

## Files to Edit

- `CompeteApp/components/LoginForms/LFInputDateRange.tsx` - Main component

## Expected Outcome

- Date picker should be clearly visible and readable
- Maintain consistency with dark theme
- Better contrast for all picker elements
