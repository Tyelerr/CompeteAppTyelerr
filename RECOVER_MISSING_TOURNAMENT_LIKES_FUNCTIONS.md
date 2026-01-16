# How to Recover Missing Tournament Likes Functions

## Problem

The functions `AddTournamentLike` and `FetchTournaments_LikedByUser` are missing from the codebase. They were in `CrudTournament_Fixed.tsx` which was deleted during cleanup.

## Solution: Use VSCode Timeline to Recover

### Step 1: Open VSCode Timeline

1. In VSCode, right-click on `CompeteApp/ApiSupabase/CrudTournament.tsx` in the Explorer
2. Select "Open Timeline" from the context menu
3. This will show you all previous versions of the file

### Step 2: Find a Version with the Missing Functions

1. Look through the timeline entries (sorted by date, newest first)
2. Click on different timeline entries to preview their contents
3. Look for a version that contains these function signatures:
   ```typescript
   export const AddTournamentLike;
   export const FetchTournaments_LikedByUser;
   ```

### Step 3: Copy the Missing Functions

Once you find a version with these functions:

1. Copy the entire `AddTournamentLike` function
2. Copy the entire `FetchTournaments_LikedByUser` function
3. Also copy any related interfaces or types they use

### Step 4: Add Functions to Current CrudTournament.tsx

1. Open the current `CompeteApp/ApiSupabase/CrudTournament.tsx`
2. Scroll to the end of the file (before the last closing brace)
3. Paste the recovered functions
4. Make sure to include any necessary imports at the top of the file

### Step 5: Verify the Fix

After adding the functions, the import errors in these files should be resolved:

- `CompeteApp/screens/ProfileLogged/ProfileLoggedFavoriteTournaments.tsx`
- `CompeteApp/screens/Billiard/ScreenBilliardThumbDetails.tsx`
- `CompeteApp/screens/Billiard/ScreenBilliardListTournaments.tsx`

## Alternative: Check Git History

If VSCode Timeline doesn't have the functions, you can also:

1. Open a terminal in the CompeteApp directory
2. Run: `git log --all --full-history -- ApiSupabase/CrudTournament.tsx`
3. Find a commit that had the functions
4. Run: `git show <commit-hash>:ApiSupabase/CrudTournament.tsx > temp_old_version.tsx`
5. Open `temp_old_version.tsx` and copy the missing functions

## What the Functions Likely Look Like

Based on how they're used in the code, the functions probably look something like this:

```typescript
export const AddTournamentLike = async (
  user: ICAUserData,
  tournament: ITournament,
  isLiked: boolean,
): Promise<{ data?: any; error?: any }> => {
  try {
    if (isLiked) {
      // Add like
      const { data, error } = await supabase.from('tournament_likes').insert({
        user_id: user.id,
        tournament_id: tournament.id,
      });
      return { data, error };
    } else {
      // Remove like
      const { data, error } = await supabase
        .from('tournament_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('tournament_id', tournament.id);
      return { data, error };
    }
  } catch (error) {
    return { error };
  }
};

export const FetchTournaments_LikedByUser = async (
  user: ICAUserData,
): Promise<{
  likedtournaments?: ILikedTournament[];
  countLikes?: number;
  data?: any;
  error?: any;
}> => {
  try {
    const { data, error } = await supabase
      .from('tournament_likes')
      .select(
        `
        *,
        tournaments (*)
      `,
      )
      .eq('user_id', user.id);

    if (error) {
      return { error };
    }

    const likedtournaments =
      data?.map((like) => ({
        ...like,
        tournamentobject: like.tournaments,
      })) || [];

    return {
      likedtournaments,
      countLikes: likedtournaments.length,
      data,
    };
  } catch (error) {
    return { error };
  }
};
```

## After Recovery

Once you've added the functions back to `CrudTournament.tsx`, the app should compile without errors.

---

**Note**: The tournament filters fix (BUILD 162) is complete and working. This is just fixing the unrelated tournament likes functionality that was accidentally broken during cleanup.
