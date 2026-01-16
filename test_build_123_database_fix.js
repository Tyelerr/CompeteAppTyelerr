// Test script to verify Build 123 database fix was applied correctly
// Run this with: node CompeteApp/test_build_123_database_fix.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseFix() {
  console.log('\n=== Testing Build 123 Database Fix ===\n');

  // Test 1: Check if functions exist and work
  console.log('Test 1: Testing check_username_available function...');
  try {
    const { data, error } = await supabase.rpc('check_username_available', {
      username_to_check: 'nonexistent_user_12345_test',
    });

    if (error) {
      console.log(
        '❌ FAILED: Function does not exist or has error:',
        error.message,
      );
      console.log('   This means the SQL script was NOT applied correctly.');
      console.log(
        '   Please re-apply CompeteApp/sql/BUILD_122_COMPLETE_FIX.sql',
      );
    } else {
      console.log('✅ PASSED: Function exists and returned:', data);
      console.log('   (Should be TRUE for non-existent username)');
    }
  } catch (err) {
    console.log('❌ FAILED: Exception:', err.message);
  }

  console.log('\nTest 2: Testing check_email_available function...');
  try {
    const { data, error } = await supabase.rpc('check_email_available', {
      email_to_check: 'nonexistent_test_12345@example.com',
    });

    if (error) {
      console.log(
        '❌ FAILED: Function does not exist or has error:',
        error.message,
      );
      console.log('   This means the SQL script was NOT applied correctly.');
    } else {
      console.log('✅ PASSED: Function exists and returned:', data);
      console.log('   (Should be TRUE for non-existent email)');
    }
  } catch (err) {
    console.log('❌ FAILED: Exception:', err.message);
  }

  // Test 3: Test with existing username (if TBar exists)
  console.log('\nTest 3: Testing with potentially existing username "TBar"...');
  try {
    const { data, error } = await supabase.rpc('check_username_available', {
      username_to_check: 'TBar',
    });

    if (error) {
      console.log('❌ FAILED:', error.message);
    } else {
      console.log('✅ Result:', data);
      console.log('   (Should be FALSE if TBar exists, TRUE if not)');
    }
  } catch (err) {
    console.log('❌ FAILED: Exception:', err.message);
  }

  // Test 4: Check RLS policies for authenticated users
  console.log('\nTest 4: Checking if authenticated users can read profiles...');
  console.log('   (This test requires you to be logged in, skipping for now)');
  console.log(
    '   To test: Try logging in with your credentials after applying the SQL',
  );

  console.log('\n=== Summary ===');
  console.log('If Tests 1 and 2 PASSED:');
  console.log('  ✅ Database functions are working');
  console.log(
    '  ✅ Registration validation will work AFTER deploying Build 123',
  );
  console.log('  ✅ Login should work immediately (try it now!)');
  console.log('\nIf Tests 1 and 2 FAILED:');
  console.log('  ❌ SQL script was not applied correctly');
  console.log('  ❌ Re-apply: CompeteApp/sql/BUILD_122_COMPLETE_FIX.sql');
  console.log('\n');
}

testDatabaseFix().catch(console.error);
