# Profiles Table Access Solution

## 🔍 Problem Analysis

**Issue**: App logs show `Total profiles fetched: 0` but Supabase dashboard shows users exist.
**Evidence**: Tournaments work fine, but profiles queries return empty results.
**Root Cause**: Likely Row Level Security (RLS) policies on the profiles table.

## 🛠️ Solution Steps

### Step 1: Check RLS Policies in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication > Policies**
3. Look for policies on the `profiles` table
4. Check if there are restrictive policies preventing data access

### Step 2: Temporary RLS Disable (for testing)

Run this SQL in your Supabase SQL editor:

```sql
-- Temporarily disable RLS on profiles table for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Step 3: Test Validation After RLS Disable

1. Restart your app
2. Go to registration form
3. Type "tyelerr" in username field
4. Should now show red text: "This username is already taken"

### Step 4: Re-enable RLS with Proper Policies

After confirming validation works, re-enable RLS with proper policies:

```sql
-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading all profiles for validation
CREATE POLICY "Allow read access for validation" ON profiles
FOR SELECT USING (true);

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow profile creation
CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🧪 Alternative: Test Component

Add this to any screen temporarily to test:

```tsx
import ProfilesDebugComponent from '../components/Debug/ProfilesDebugComponent';

// Add this to your render method:
<ProfilesDebugComponent />;
```

## ✅ Expected Results After Fix

Once RLS is properly configured:

- **Console logs** will show actual profile counts > 0
- **Existing usernames** like "tyelerr" will show red error text
- **Existing emails** like "tyelerr@yahoo.com" will show red error text
- **New usernames/emails** will show green "available" text
- **Validation will work correctly**

## 🚨 If Still Not Working

1. **Check table permissions**: Ensure your service role key has access
2. **Verify column names**: Confirm `user_name` and `email` columns exist
3. **Check data types**: Ensure columns are text/varchar
4. **Test with admin user**: Try validation while logged in as admin

## 📝 Quick Test SQL

Run this in Supabase SQL editor to verify data exists:

```sql
-- Check if profiles exist
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check specific usernames
SELECT user_name, email, status FROM profiles
WHERE LOWER(user_name) IN ('tyelerr', 'user1', 'bobs')
LIMIT 10;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
```
