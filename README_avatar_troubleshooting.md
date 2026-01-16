# Avatar Troubleshooting Guide

## Current Issue

The avatar images are not displaying correctly in the ModalChooseAvatar component.

## Debugging Steps

### 1. Check Console Logs

When you open the avatar selection modal, check the console for these messages:

- `Successfully loaded avatar X` - means the image loaded correctly
- `Error loading avatar X, using fallback` - means the image failed to load

### 2. Restart Development Server

If images aren't loading, try restarting the Metro bundler:

**For Expo:**

```bash
cd CompeteApp
npx expo start --clear
```

**For React Native CLI:**

```bash
cd CompeteApp
npx react-native start --reset-cache
```

### 3. Check Image Files

Verify the avatar images exist:

```bash
ls -la CompeteApp/assets/avatars/
```

Should show: avatar1.jpg, avatar2.jpg, avatar3.jpg, avatar4.jpg, avatar5.jpg

### 4. Test the Modal

1. Open the app
2. Navigate to your profile
3. Click "Choose avatar" button
4. Check if the modal opens
5. Look for fallback indicators in the avatar labels

### 5. Check Metro Configuration

If images still don't load, check if `metro.config.js` includes image extensions:

```javascript
module.exports = {
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg'],
  },
};
```

## Expected Behavior

- Modal should open when "Choose avatar" is clicked
- 5 avatar images should display (or fallback images with "(fallback)" labels)
- Clicking an avatar should close the modal and update the profile
- Selected avatar should appear in the ProfileHeading component

## Files Modified

- `CompeteApp/components/Profile/ModalChooseAvatar.tsx` - Added fallback logic
- `CompeteApp/screens/ProfileLogged/ProfileHeading.tsx` - Added avatar mapping
- `CompeteApp/screens/ProfileLogged/PanelUserDetailsAndEditor.tsx` - Fixed database field

## Next Steps

1. Test the modal with the new fallback logic
2. Check console logs for error messages
3. If still not working, restart the development server
4. Report back with any console error messages
