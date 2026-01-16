# Keyboard Closing Issue - Diagnosis & Solution

## Issue

The keyboard is closing unexpectedly when typing in the giveaway modal input fields.

## Root Cause

The issue is caused by the **GlobalDoneBar** component (`CompeteApp/components/UI/GlobalDoneBar.tsx`) which provides a "Done" button that calls `Keyboard.dismiss()`. This global done bar is being attached to the TextInput fields in the giveaway modals, and when users interact with it, the keyboard dismisses.

## Investigation Findings

### Files Analyzed:

1. ✅ `CompeteApp/screens/Shop/ModalCreateGiveaway.tsx` - Already has proper keyboard settings
2. ✅ `CompeteApp/screens/Shop/ModalEditGiveaway.tsx` - Already has proper keyboard settings
3. ✅ `CompeteApp/components/LoginForms/LFInput.tsx` - Has `autoFocus: false` hardcoded
4. ⚠️ `CompeteApp/components/UI/GlobalDoneBar.tsx` - Contains `Keyboard.dismiss()` call

### Current Keyboard Settings in Modals:

Both giveaway modals already have:

- `keyboardDismissMode="none"` on ScrollView ✅
- `keyboardShouldPersistTaps="handled"` on ScrollView ✅
- `KeyboardAvoidingView` wrapper ✅

## The Problem

The standard `TextInput` components in the giveaway modals are using the global `DONE_ACCESSORY_ID` from GlobalDoneBar, which has a "Done" button that dismisses the keyboard. When users tap this button (or it's triggered somehow), the keyboard closes.

## Recommended Solutions

### Option 1: Disable the Done Bar for Giveaway Modals (Quick Fix)

Add `inputAccessoryViewID={undefined}` to all TextInput components in the giveaway modals to prevent them from using the GlobalDoneBar.

### Option 2: Use LFInput Component (Better Long-term)

Replace the standard `TextInput` components with the `LFInput` component which has better keyboard handling and the `disableAccessoryBar` prop.

### Option 3: Modify GlobalDoneBar Behavior (Most Complex)

Update the GlobalDoneBar to not dismiss the keyboard in certain contexts, but this could affect other parts of the app.

## Next Steps

1. Test the keyboard behavior in the giveaway modals on a physical device
2. Implement Option 1 as a quick fix if confirmed
3. Consider Option 2 for a more robust solution

## Additional Notes

- The backup file `screens_BACKUP_BUILD54/Shop/ModalCreateGiveaway.tsx` had old references to `autoFocus`, `inputRef`, and `firstInputRef` but these have been removed from the active files
- Build number has been updated from 55 to 56 in `app.json`
