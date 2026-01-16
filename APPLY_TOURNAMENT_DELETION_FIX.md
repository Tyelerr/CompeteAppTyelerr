# Quick Guide: Apply Tournament Deletion Fix

## 🚀 Quick Start (3 Steps)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Click **New Query**
2. Copy the contents of `CompeteApp/sql/fix_tournament_deletion_security_definer.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success

You should see output similar to:

```
function_name                        | security_type
-------------------------------------|------------------
archive_tournament_manual_simple     | SECURITY DEFINER
archive_expired_tournaments_simple   | SECURITY DEFINER
```

## ✅ Testing the Fix

### Option 1: Manual Test

1. Go to your admin panel
2. Create a test tournament
3. Delete the tournament
4. Verify it's gone from the tournaments list
5. Check that it appears in archived tournaments

### Option 2: Automated Test

```bash
cd CompeteApp
node test_tournament_deletion.js
```

Expected output:

```
✅ Tournament archived successfully
✅ Tournament removed from tournaments table
```

## 📋 What This Fixes

**Before:**

- ✅ Tournament archived to tournaments_archive
- ❌ Tournament NOT removed from tournaments table
- ❌ Tournament appears in both active and archived lists

**After:**

- ✅ Tournament archived to tournaments_archive
- ✅ Tournament removed from tournaments table
- ✅ Tournament only appears in archived list

## 🔧 Troubleshooting

### Issue: "Permission denied for function"

**Solution:** Make sure you're logged in as the database owner or have SUPERUSER privileges.

### Issue: "Function does not exist"

**Solution:** Run the migration script first. The functions need to be created before they can be updated.

### Issue: "Tournaments still not deleting"

**Solution:**

1. Verify the functions have SECURITY DEFINER (see Step 3 above)
2. Check Supabase logs for error messages
3. Try running the test script to see detailed error output

## 📝 SQL Script Location

The fix is in: `CompeteApp/sql/fix_tournament_deletion_security_definer.sql`

## 📚 Full Documentation

For complete details, see: `CompeteApp/TOURNAMENT_DELETION_FIX_COMPLETE.md`

## ⚠️ Important Notes

- This fix is **safe** and uses PostgreSQL's built-in security features
- No changes needed to your application code
- Existing archived tournaments are not affected
- The fix applies to both manual and automatic tournament archival

## 🆘 Need Help?

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Verify you have the correct database permissions
3. Review the full documentation in `TOURNAMENT_DELETION_FIX_COMPLETE.md`
4. Run the test script for diagnostic information

---

**Estimated Time:** 2-3 minutes
**Difficulty:** Easy
**Risk Level:** Low (Safe to apply)
