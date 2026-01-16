# Build 60 - Summary of Changes

## Build Number

- iOS buildNumber: 60
- Android versionCode: 60

## Fixes Implemented

### 1. Tournament Director Deletion Fix ✅

**File**: `CompeteApp/ApiSupabase/CrudUser.tsx`

**Problem**: When deleting a Tournament Director from the admin dashboard, their `td_id` wasn't being cleared from venues, causing Bar Owner dashboards to still show the deleted TD.

**Solution**: Updated the `DeleteUser` function to:

- Check if the user being deleted is a Tournament Director
- Clear both `td_id` and `tournament_director_id` fields from all venues where they were assigned
- Use `supabaseAdmin` to bypass RLS policies

**Code Added**:

```typescript
// If the user is a Tournament Director, clear their assignment from all venues
if (
  userForDeleting.role === EUserRole.TournamentDirector &&
  userForDeleting.id_auto
) {
  console.log(
    'DeleteUser: Clearing TD assignment from venues for user:',
    userForDeleting.id_auto,
  );

  const { error: venueError } = await supabaseAdmin
    .from('venues')
    .update({ td_id: null, tournament_director_id: null })
    .eq('td_id', userForDeleting.id_auto);

  if (venueError) {
    console.error('DeleteUser: Error clearing TD from venues:', venueError);
  } else {
    console.log('DeleteUser: Successfully cleared TD assignment from venues');
  }
}
```

### 2. Keyboard Persistence Attempt (Still Not Working) ⚠️

**File**: `CompeteApp/screens/Shop/ModalCreateGiveaway.tsx`

**Problem**: Keyboard closes when typing in any field in the Create Giveaway modal.

**Attempted Fixes**:

- Added `returnKeyType="done"` to TextInput
- Added `blurOnSubmit={false}` to TextInput
- Added `inputAccessoryViewID={undefined}` to TextInput
- Added `activeOpacity={1}` to background TouchableOpacity
- Set `keyboardDismissMode="none"` on ScrollView
- Set `keyboardShouldPersistTaps="handled"` on ScrollView

**Status**: User reports keyboard still closing - needs further investigation

### 3. Code Cleanup ✅

- Removed merge conflict markers from build 57
- Removed invalid `autoFocus`, `inputRef`, and `firstInputRef` references
- All form fields intact including `maximumEntries`

## Known Issues

### Keyboard Still Closing in Create Giveaway Modal

The keyboard continues to close when typing despite multiple attempted fixes. Possible causes to investigate:

1. Global keyboard event listeners
2. Modal's `onRequestClose` behavior
3. KeyboardAvoidingView configuration
4. Platform-specific keyboard behavior
5. Possible conflict with other modals or components

## Next Steps

1. Further investigate keyboard closing issue
2. Consider using a different modal implementation
3. Test if issue occurs on both iOS and Android
4. Check if other modals have the same issue
