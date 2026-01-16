# Chip Tournament Implementation - TODO

## Task: Modify chip tournament functionality in Submit Tournament page

### Requirements:

1. First chip count field should have "3" as default value (editable)
2. When adding new chip rows, take the number from the row above, add 1, and put it in the new row
3. Keep Fargo Range functionality as is

### Changes Made:

- [x] Update `getChipInputsWithStaticPlaceholders` function to show "3" placeholder
- [x] Modify `handleChipAllocationsChange` function to increment from previous row instead of first row
- [x] Update `useEffect` to show "3" as placeholder (not pre-filled value)
- [x] Implementation complete

### Files to Edit:

- `CompeteApp/screens/Submit/ScreenSubmit.tsx`

### Progress:

- [x] Analysis complete
- [x] Plan approved by user
- [x] Implementation complete
- [x] Final adjustment for placeholder behavior

### Implementation Details:

1. **Modified `handleChipAllocationsChange` function**:

   - Changed logic to look at previous row instead of first row
   - Now uses `index > 0 && newChipAllocations[index - 1][0]?.value` to get previous row's chip count
   - Auto-increments by adding 1 to previous row's value: `previousChipCount + 1`

2. **Updated `getChipInputsWithStaticPlaceholders` function**:

   - Changed placeholder from empty string to "3" for chip count field
   - Keeps Fargo Range placeholder logic unchanged

3. **Updated `useEffect` logic**:
   - First row now has empty value with "3" as placeholder (disappears when clicked)
   - User can edit this value, and subsequent rows will increment from whatever they put in
   - Placeholder behavior: shows "3" until user clicks and starts typing

### Final Behavior:

- First chip count field shows "3" as placeholder text
- When user clicks into the field, placeholder disappears
- When adding new chip rows, each new row increments from the previous row's value + 1
- If user changes the first row to "5", the next row will be "6", then "7", etc.
