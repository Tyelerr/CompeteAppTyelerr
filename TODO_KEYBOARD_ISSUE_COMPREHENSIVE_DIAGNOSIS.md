# Keyboard Closing Issue - Comprehensive Diagnosis Required

## Current Status

The keyboard closes immediately when typing in the Create Giveaway modal despite multiple attempted fixes.

## Attempted Fixes (Build 61)

- ✅ Added `returnKeyType="done"` to TextInput
- ✅ Added `blurOnSubmit={false}` to TextInput
- ✅ Added `inputAccessoryViewID={undefined}` to TextInput
- ✅ Added `activeOpacity={1}` to background TouchableOpacity
- ✅ Set `keyboardDismissMode="none"` on ScrollView
- ✅ Set `keyboardShouldPersistTaps="handled"` on ScrollView
- ✅ Verified GlobalDoneBar is commented out in App.tsx

## Systematic Diagnosis Needed

### 1. Turn on Focus Logging

Add to TextInput components:

```typescript
onFocus={() => console.log('INPUT FOCUSED')}
onBlur={() => console.log('INPUT BLURRED')}
onChangeText={(text) => {
  console.log('TEXT CHANGED:', text);
  onChangeText(text);
}}
```

### 2. Check for Parent Pressables

**Location**: `ModalCreateGiveaway.tsx`

- ✅ Background TouchableOpacity has `activeOpacity={1}`
- ⚠️ Need to verify no other TouchableOpacity/Pressable wrapping inputs
- ⚠️ Check if `StyleModal.container` or `StyleModal.containerForFixedLayout` have touch handlers

### 3. ScrollView Configuration

**Current Settings**:

```typescript
<ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="none" />
```

**To Test**:

- Try `keyboardShouldPersistTaps="always"` instead of "handled"
- Check for nested ScrollViews

### 4. KeyboardAvoidingView

**Current Setup**:

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={0}
/>
```

**To Test**:

- Try different `behavior` values
- Adjust `keyboardVerticalOffset`
- Move KAV position in component tree

### 5. Check for Re-renders

**Potential Issues**:

- Modal `visible` prop changing
- Component remounting on each keystroke
- State updates causing full modal re-render

**To Test**:

- Add `console.log('MODAL RENDER')` at component top
- Check if tab state changes trigger remounts
- Verify no conditional rendering around active input

### 6. TextInput Props Audit

**Current Props**:

```typescript
multiline={!!multiline}
keyboardType={keyboardType || 'default'}
keyboardAppearance="dark"
returnKeyType="done"
blurOnSubmit={false}
inputAccessoryViewID={undefined}
```

**To Check**:

- Remove `keyboardAppearance` temporarily
- Test without `returnKeyType`
- Verify no `onSubmitEditing` handler

### 7. Global Keyboard Listeners

**To Check**:

- Search codebase for `Keyboard.addListener`
- Search for `Keyboard.dismiss()` calls
- Check if any global event handlers

### 8. Modal Library Issues

**Current**: Using React Native's built-in `Modal`

```typescript
<Modal
  visible={visible}
  animationType="fade"
  transparent={true}
  onRequestClose={closeAndReset}
  statusBarTranslucent={true}
  presentationStyle="overFullScreen"
/>
```

**To Test**:

- Try `presentationStyle="fullScreen"` instead
- Test without `statusBarTranslucent`
- Check if `onRequestClose` is being triggered

### 9. Android-Specific

**To Check**:

- Verify `android:windowSoftInputMode="adjustResize"` in AndroidManifest.xml
- Test with `softwareKeyboardLayoutMode: "pan"` in app.json (already set)

### 10. Invisible Overlays

**To Check**:

- Temporarily remove fixed header
- Temporarily remove fixed footer
- Check if close button overlay interferes

## Recommended Next Steps

1. **Add Comprehensive Logging**

   - Add focus/blur/change logging to all TextInputs
   - Add render logging to modal component
   - Monitor console during typing

2. **Isolate the Issue**

   - Create a minimal test modal with single TextInput
   - If that works, gradually add back complexity
   - Identify which component/prop causes the issue

3. **Test on Different Platforms**

   - Test on iOS simulator
   - Test on Android emulator
   - Test on physical devices
   - Issue may be platform-specific

4. **Compare with Working Modals**

   - Check `ModalEditGiveaway.tsx` - does it have the same issue?
   - Check other modals in the app
   - Identify differences in implementation

5. **Consider Alternative Approaches**
   - Use a different modal library (react-native-modal)
   - Implement as a full-screen navigation screen instead
   - Use a bottom sheet component

## Files to Review

- `CompeteApp/screens/Shop/ModalCreateGiveaway.tsx` - Main modal
- `CompeteApp/assets/css/styles.tsx` - StyleModal definitions
- `CompeteApp/App.tsx` - Check for global keyboard handlers
- `CompeteApp/app.json` - Android keyboard settings

## Priority

**HIGH** - This significantly impacts user experience when creating giveaways.

## Recommendation for Build 61

Deploy with the TD deletion fix. Address keyboard issue in Build 62 after proper diagnosis.
