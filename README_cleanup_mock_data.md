# Mock Tournament Data Cleanup Guide

This guide explains how to remove all mock tournaments and test data from your Supabase database.

## 📋 What Gets Cleaned Up

The cleanup script will remove:

- ✅ All tournaments with "Mock" in the name
- ✅ All tournaments with "Test" in the name
- ✅ Tournaments created by "Director A" or "Director B"
- ✅ Tournaments at "Venue 1" or "Venue 2"
- ✅ Tournaments with mock descriptions
- ✅ Tournaments with id_unique_number 1 or 2
- ✅ All associated likes and tournament views
- ✅ Orphaned data references

## 🚀 How to Run the Cleanup

### Option 1: Using the Batch File (Windows)

1. **Update Supabase credentials** in `run_cleanup_mock_data.js`:

   ```javascript
   const supabaseUrl = 'https://your-project.supabase.co'; // Your actual URL
   const supabaseKey = 'your-service-role-key'; // Your service role key
   ```

2. **Run the batch file**:
   ```bash
   run_cleanup_mock_data.bat
   ```

### Option 2: Using Node.js Directly

1. **Update Supabase credentials** in `run_cleanup_mock_data.js`
2. **Run the script**:
   ```bash
   node run_cleanup_mock_data.js
   ```

### Option 3: Manual SQL Execution

1. **Copy the SQL** from `sql/cleanup_mock_data.sql`
2. **Run it directly** in your Supabase SQL editor

## 🔧 Configuration Required

Before running the cleanup, you **MUST** update these values in `run_cleanup_mock_data.js`:

```javascript
// Replace these with your actual Supabase project details
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-service-role-key';
```

### Where to Find Your Credentials:

1. **Supabase URL**: Go to your Supabase project → Settings → API → Project URL
2. **Service Role Key**: Go to your Supabase project → Settings → API → Service Role Key

## 📊 What You'll See

The script will show:

- ✅ Number of SQL statements executed
- ✅ Success/error status for each operation
- ✅ Final count of remaining tournaments
- ✅ Sample list of remaining tournaments

## ⚠️ Important Notes

- **Backup First**: Consider backing up your database before running cleanup
- **Service Role Key**: Required for administrative operations
- **Irreversible**: This action cannot be undone
- **Safe**: Only removes mock/test data, preserves real tournaments

## 🎯 Expected Results

After cleanup:

- Mock tournaments will be completely removed
- Real tournaments will remain untouched
- Database will be clean for production use
- Zip code filtering will work with real venue data only

## 🔍 Verification

The script automatically verifies cleanup by:

1. Counting remaining tournaments
2. Showing sample tournament names
3. Confirming no mock data remains

## 📁 Files Included

- `sql/cleanup_mock_data.sql` - The SQL cleanup script
- `run_cleanup_mock_data.js` - Node.js execution script
- `run_cleanup_mock_data.bat` - Windows batch file
- `README_cleanup_mock_data.md` - This guide

## 🆘 Troubleshooting

**Error: "Invalid API key"**

- Check your service role key is correct
- Ensure you're using the service role key, not the anon key

**Error: "Project not found"**

- Verify your Supabase URL is correct
- Check the project is active

**No tournaments removed**

- Check if mock tournaments exist in your database
- Verify the tournament names match the patterns in the SQL script

## ✅ Success!

Once completed, your billiards page zip code filtering will work with clean, real venue data only!
