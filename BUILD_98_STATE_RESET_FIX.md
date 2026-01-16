# Build 98 - Fix State Reset Issue

## Problem Identified

You confirmed that:

- ✅ Values ARE displayed in the input fields correctly
- ✅ You can see "CA" in the dropdown after selecting it
- ✅ You can see "Efren Reyes" as you type it
- ❌ But when you click Save, the alert shows empty values

This means the state is being **RESET** right before the save function is called!

## Root Cause

In `FormUserEditor.tsx`, there was a `useEffect` that ran every time `userThatNeedToBeEdited` changed:

```tsx
useEffect(() => {
  // This resets ALL state variables
  set_home_state(userThatNeedToBeEdited.home_state || '');
  set_favorite_player(userThatNeedToBeEdited.favorite_player as string);
  set_favorite_game(userThatNeedToBeEdited.favorite_game as string);
  // ...
}, [userThatNeedToBeEdited]); // ← Runs every time user object changes!
```

**The Problem:**

1. You select "CA" → `home_state` state = "CA" ✓
2. You click Save → UpdateProfile is called
3. UpdateProfile calls `FetchProfileData` to get fresh user data
4. Fresh user data triggers `EventAfterUpdatingTheUser`
5. This updates the `user` context
6. The updated `user` is passed as `userThatNeedToBeEdited`
7. The useEffect runs again and RESETS all state to the OLD database values (empty!)
8. The alert shows empty values

## The Fix

Changed the useEffect to only run ONCE when the component mounts:

```tsx
const [isInitialized, setIsInitialized] = useState(false);

useEffect(() => {
  if (!isInitialized) {
    // Initialize form data ONCE
    set_home_state(userThatNeedToBeEdited.home_state || '');
    set_favorite_player(userThatNeedToBeEdited.favorite_player as string);
    set_favorite_game(userThatNeedToBeEdited.favorite_game as string);
    // ...
    setIsInitialized(true);
  }
}, [userThatNeedToBeEdited, isInitialized]);
```

Now the form data is initialized once and won't be reset when the user object updates.

## Files Modified

1. **FormUserEditor.tsx** - Prevent state reset on user object updates
2. **app.json** - Build 98

## Expected Behavior in Build 98

When you click Save, the alert should show:

```
Saving Profile
Home State: CA
Favorite Player: Efren Reyes
Favorite Game: 9-Ball
```

And the values should save to the database!

## Date

December 2024
