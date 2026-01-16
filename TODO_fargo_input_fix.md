# Fargo Input Fix - Search Alerts

## Problem

Users cannot properly backspace Fargo rating inputs in search alerts. When they try to backspace "0", it just adds another "0" instead of clearing the field.

## Root Cause

The issue is in `ModalProfileAddAlert.tsx` where numeric inputs are using `Number(text)` conversion in `onChangeText` handlers, which prevents empty strings and causes the backspace issue.

## Solution Plan

- [x] Create TODO file to track progress
- [ ] Fix Fargo range inputs (Min/Max Fargo) - change from number to string state
- [ ] Fix Max Entry Fee input - change from number to string state
- [ ] Fix Required Fargo Games input - change from number to string state
- [ ] Update \_\_\_GetTheInputDetails function to handle string-to-number conversion
- [ ] Update getTheAlert function to handle new string-based states
- [ ] Test the functionality

## Files to Edit

- `CompeteApp/screens/ProfileLogged/ModalProfileAddAlert.tsx`

## Expected Outcome

Users should be able to:

1. Completely clear Fargo input fields by backspacing
2. Type any number they want without interference
3. See proper placeholder behavior when fields are empty
4. Save and load alerts correctly with the new implementation
