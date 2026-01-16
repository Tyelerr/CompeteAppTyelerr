/**
 * Test Edge Function Connection
 * This script tests if the edge function is reachable and properly configured
 */

require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== EDGE FUNCTION CONNECTION TEST ===\n');

// Check environment variables
console.log('1. Checking Environment Variables:');
console.log('   SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('\n❌ Missing environment variables!');
  console.log('\nMake sure you have a .env file with:');
  console.log('  EXPO_PUBLIC_SUPABASE_URL=your_url');
  console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/update-user-email`;

console.log('\n2. Edge Function URL:');
console.log('   ', EDGE_FUNCTION_URL);

// Test 1: Check if edge function endpoint exists (without auth)
console.log('\n3. Testing Edge Function Endpoint (without auth):');
fetch(EDGE_FUNCTION_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    newEmail: 'test@example.com',
    currentPassword: 'test',
  }),
})
  .then((response) => {
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    if (response.status === 401) {
      console.log(
        '   ✓ Edge function is reachable (401 = needs auth, which is expected)',
      );
    } else if (response.status === 404) {
      console.log('   ✗ Edge function NOT FOUND - it may not be deployed!');
    } else {
      console.log('   ? Unexpected status code');
    }

    return response.text();
  })
  .then((text) => {
    console.log('   Response:', text);

    console.log('\n=== DIAGNOSIS ===');
    console.log('\nIf you see 404 (Not Found):');
    console.log('  → The edge function is NOT deployed');
    console.log(
      '  → Run: cd CompeteApp && npx supabase functions deploy update-user-email',
    );

    console.log('\nIf you see 401 (Unauthorized):');
    console.log('  → The edge function IS deployed and working');
    console.log('  → The issue is likely in the app not calling it');
    console.log(
      '  → Check your React Native console for EdgeFunctionService logs',
    );

    console.log('\nIf you see 500 (Internal Server Error):');
    console.log(
      '  → The edge function is deployed but has configuration issues',
    );
    console.log('  → Check Supabase Dashboard → Edge Functions → Secrets');
    console.log(
      '  → Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set',
    );

    console.log('\n=== NEXT STEPS ===');
    console.log('\n1. Check Supabase Dashboard:');
    console.log(
      '   https://supabase.com/dashboard → Your Project → Edge Functions',
    );
    console.log('   - Is "update-user-email" listed?');
    console.log('   - Click on it and check the Logs tab');

    console.log('\n2. If function is not deployed, deploy it:');
    console.log('   cd CompeteApp');
    console.log('   npx supabase functions deploy update-user-email');

    console.log('\n3. Test in your app:');
    console.log('   - Open the edit profile modal');
    console.log('   - Try to change email');
    console.log(
      '   - Check React Native console for "EdgeFunctionService:" logs',
    );
    console.log('   - Check Supabase Dashboard → Edge Functions → Logs');
  })
  .catch((error) => {
    console.error('\n❌ Network Error:', error.message);
    console.log('\nPossible causes:');
    console.log('  - No internet connection');
    console.log('  - Supabase URL is incorrect');
    console.log('  - Firewall blocking the request');
  });
