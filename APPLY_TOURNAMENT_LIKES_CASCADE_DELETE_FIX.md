# Fix Tournament Deletion - Apply CASCADE DELETE for Likes

## Problem

You're getting this error when trying to delete tournaments:

```
Unable to delete row as it is currently referenced by a foreign key constraint from the table `likes`
```

## Root Cause

The `likes` table has a foreign key constraint to the `tournaments` table, but it's set to **RESTRICT** deletion instead of **CASCADE** deletion. This means when you try to delete a tournament, the database prevents it because there are still likes referencing that tournament.

## Solution

Apply the SQL script that updates the foreign key constraint to automatically delete likes when a tournament is deleted.

## Steps to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**

   - Go to your Supabase project dashboard
   - Navigate to the **SQL Editor** section

2. **Copy the SQL Script**

   - Open the file: `CompeteApp/sql/fix_likes_cascade_delete_for_tournaments.sql`
   - Copy the entire contents

3. **Run the Script**

   - Paste the SQL into the SQL Editor
   - Click **Run** to execute the script

4. **Verify the Fix**
   - The script will show you the constraint details before and after
   - Look for `delete_rule` to change from `NO ACTION` or `RESTRICT` to `CASCADE`

### Option 2: Using Command Line (Alternative)

If you have the Supabase CLI installed:

```bash
cd CompeteApp
supabase db push --file sql/fix_likes_cascade_delete_for_tournaments.sql
```

## What This Fix Does

1. **Drops the old foreign key constraint** that prevents deletion
2. **Creates a new foreign key constraint** with `ON DELETE CASCADE`
3. **Cleans up any orphaned likes** (likes for tournaments that no longer exist)

## After Applying the Fix

Once applied, you'll be able to:

- ✅ Delete tournaments without getting foreign key errors
- ✅ Likes will be automatically deleted when a tournament is deleted
- ✅ No manual cleanup of likes needed before deleting tournaments

## Testing

After applying the fix, try deleting one of those past tournaments again. The deletion should now work without errors, and all associated likes will be automatically removed.

## Important Notes

- **Note on Column Name**: The likes table uses `turnament_id` (with one 'o'), not `tournament_id`. The SQL script handles this correctly.
- **Backup**: This is a non-destructive change, but it's always good practice to have backups
- **Immediate Effect**: Once applied, the fix takes effect immediately

## Need Help?

If you encounter any issues applying this fix, let me know and I can help troubleshoot!
