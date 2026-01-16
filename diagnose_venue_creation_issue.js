const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log(
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseVenueCreation() {
  console.log('🔍 DIAGNOSING VENUE CREATION ISSUE\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Check if user is authenticated
    console.log('\n📋 Step 1: Checking Authentication');
    console.log('-'.repeat(60));

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Not authenticated or error getting user');
      console.log('Please log in to the app first, then run this script again');
      return;
    }

    console.log('✅ User authenticated');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);

    // Step 2: Check user's profile and role
    console.log('\n📋 Step 2: Checking User Profile & Role');
    console.log('-'.repeat(60));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, id_auto, email, role, user_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
      return;
    }

    console.log('✅ Profile found');
    console.log(`   ID: ${profile.id}`);
    console.log(`   ID Auto: ${profile.id_auto}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Username: ${profile.user_name}`);

    if (profile.role !== 'BarOwner' && profile.role !== 'BarAdmin') {
      console.log('\n⚠️  WARNING: User role is not BarOwner or BarAdmin');
      console.log(`   Current role: ${profile.role}`);
      console.log('   This user may not have permission to create venues');
      console.log('\n   To fix, run this SQL in Supabase Dashboard:');
      console.log(
        `   UPDATE profiles SET role = 'BarOwner' WHERE email = '${profile.email}';`,
      );
    }

    // Step 3: Check existing RLS policies on venues table
    console.log('\n📋 Step 3: Checking RLS Policies on Venues Table');
    console.log('-'.repeat(60));

    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            cmd,
            permissive,
            roles,
            with_check
          FROM pg_policies 
          WHERE tablename = 'venues'
          ORDER BY policyname;
        `,
      })
      .catch(() => {
        // If RPC doesn't exist, we can't check policies programmatically
        return {
          data: null,
          error: { message: 'Cannot check policies via RPC' },
        };
      });

    if (policiesError || !policies) {
      console.log('⚠️  Cannot check policies programmatically');
      console.log(
        '   Please check policies manually in Supabase Dashboard → Database → Policies',
      );
    } else {
      console.log(`✅ Found ${policies.length} policies on venues table`);
      policies.forEach((policy, index) => {
        console.log(`\n   Policy ${index + 1}:`);
        console.log(`   - Name: ${policy.policyname}`);
        console.log(`   - Command: ${policy.cmd}`);
        console.log(`   - Permissive: ${policy.permissive}`);
        console.log(`   - Roles: ${policy.roles}`);
      });
    }

    // Step 4: Test venue creation with actual data
    console.log('\n📋 Step 4: Testing Venue Creation');
    console.log('-'.repeat(60));

    const testVenueData = {
      venue: 'Test Venue - Diagnostic',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      barowner_id: profile.id_auto,
      phone: '555-1234',
      latitude: null,
      longitude: null,
    };

    console.log('Attempting to insert test venue with data:');
    console.log(JSON.stringify(testVenueData, null, 2));

    const { data: insertedVenue, error: insertError } = await supabase
      .from('venues')
      .insert([testVenueData])
      .select()
      .single();

    if (insertError) {
      console.log('\n❌ VENUE CREATION FAILED');
      console.log(`   Error Code: ${insertError.code}`);
      console.log(`   Error Message: ${insertError.message}`);
      console.log(`   Error Details: ${insertError.details || 'N/A'}`);
      console.log(`   Error Hint: ${insertError.hint || 'N/A'}`);

      if (
        insertError.code === '42501' ||
        insertError.message.includes('policy')
      ) {
        console.log('\n🔧 DIAGNOSIS: RLS Policy Issue');
        console.log(
          '   The error indicates a Row Level Security policy is blocking the insert.',
        );
        console.log('\n   SOLUTION:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Copy and paste the entire content from:');
        console.log(
          '      CompeteApp/sql/fix_venue_creation_barowner_final.sql',
        );
        console.log('   3. Click Run (or press Ctrl+Enter)');
        console.log('   4. Verify the policy was created successfully');
        console.log('   5. Try creating a venue again in the app');
      }
    } else {
      console.log('\n✅ VENUE CREATION SUCCESSFUL!');
      console.log(`   Venue ID: ${insertedVenue.id}`);
      console.log(`   Venue Name: ${insertedVenue.venue}`);

      // Clean up test venue
      console.log('\n🧹 Cleaning up test venue...');
      const { error: deleteError } = await supabase
        .from('venues')
        .delete()
        .eq('id', insertedVenue.id);

      if (deleteError) {
        console.log(
          `⚠️  Could not delete test venue (ID: ${insertedVenue.id})`,
        );
        console.log('   Please delete it manually from Supabase Dashboard');
      } else {
        console.log('✅ Test venue deleted successfully');
      }

      console.log('\n✅ DIAGNOSIS COMPLETE: Venue creation is working!');
      console.log(
        '   The issue may have been resolved, or it might be specific to the app.',
      );
    }

    // Step 5: Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));

    console.log('\n✅ Checks Completed:');
    console.log(`   - User authenticated: ${user ? 'Yes' : 'No'}`);
    console.log(`   - Profile found: ${profile ? 'Yes' : 'No'}`);
    console.log(`   - User role: ${profile?.role || 'Unknown'}`);
    console.log(`   - User ID Auto: ${profile?.id_auto || 'Unknown'}`);

    if (insertError) {
      console.log('\n❌ Issue Found: Venue creation failed');
      console.log('\n🔧 REQUIRED ACTION:');
      console.log('   Run the SQL fix in Supabase Dashboard:');
      console.log(
        '   File: CompeteApp/sql/fix_venue_creation_barowner_final.sql',
      );
    } else {
      console.log('\n✅ Venue creation test passed');
      console.log('\n💡 If the app still shows an error:');
      console.log('   1. Check browser console (F12) for JavaScript errors');
      console.log('   2. Verify barownerId is being passed correctly');
      console.log('   3. Check Supabase logs for detailed error information');
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnoseVenueCreation()
  .then(() => {
    console.log('\n✅ Diagnosis complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
