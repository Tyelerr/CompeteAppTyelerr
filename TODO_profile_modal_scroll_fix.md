# Profile Modal Scroll Fix - TODO

## Problem

The edit profile modal currently has the close button (X) and bottom action buttons (Save Changes/Cancel) scrolling with the content, making them inaccessible when users scroll through the form.

## Solution

Restructure the modal to have:

- Fixed header with close button and title
- Scrollable middle section with form content only
- Fixed footer with action buttons

## Progress

### Step 1: Add new styles for fixed header/footer layout

- [ ] Add modalFixedHeader style
- [ ] Add modalFixedFooter style
- [ ] Add modalScrollableContent style

### Step 2: Update FormUserEditor.tsx

- [ ] Remove LBButtonsGroup from the component
- [ ] Add callback props for save and cancel actions
- [ ] Return only the form fields without buttons

### Step 3: Update ModalProfileEditor.tsx

- [ ] Restructure layout with fixed header, scrollable content, and fixed footer
- [ ] Move close button to fixed header
- [ ] Add action buttons to fixed footer
- [ ] Update ScrollView to only contain form content

### Step 4: Testing

- [ ] Test modal functionality
- [ ] Verify buttons remain accessible during scroll
- [ ] Check form submission and cancellation
- [ ] Test on different screen sizes

## Files to be modified:

1. CompeteApp/assets/css/styles.tsx - Add new modal styles
2. CompeteApp/screens/ProfileLogged/FormUserEditor.tsx - Remove buttons, add callbacks
3. CompeteApp/screens/ProfileLogged/ModalProfileEditor.tsx - Restructure layout
