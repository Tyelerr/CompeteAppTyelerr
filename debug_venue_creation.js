const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugVenueCreation() {
  console.log('=== Debugging Venue Creation Issue ===\n');

  // Test data similar to what the user is entering
  const testVenueData = {
    venue: 'Test Venue',
    address: '4238 W Bell Rd, Glendale, AZ 85308, USA',
    phone: null,
    td_id: null,
    barowner_id: 1, // Replace with actual bar owner ID if known
    latitude: null,
    longitude: null,
    city: 'Glendale',
    state: 'AZ',
    zip_code: '85308',
  };

  console.log('1. Testing venue creation with data:');
  console.log(JSON.stringify(testVenueData, null, 2));
  console.log('');

  // Try to insert the venue
  const { data, error } = await supabase
    .from('venues')
    .insert([testVenueData])
    .select()
    .single();

  if (error) {
    console.log('❌ ERROR creating venue:');
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);
    console.log('Error hint:', error.hint);
    console.log('Error code:', error.code);
    console.log('');

    // Check RLS policies
    console.log('2. Checking RLS policies on venues table...');
    const { data: policies, error: policiesError } = await supabase.rpc(
      'exec_sql',
      {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'venues';
        `,
      },
    );

    if (policiesError) {
      console.log(
        'Could not fetch policies (this is expected if RPC is not set up)',
      );
      console.log('');
    } else {
      console.log('Policies:', JSON.stringify(policies, null, 2));
      console.log('');
    }

    // Check table structure
    console.log('3. Checking venues table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('venues')
      .select('*')
      .limit(0);

    if (columnsError) {
      console.log('Error fetching table structure:', columnsError.message);
    }
    console.log('');

    // Try to check if barowner_id constraint exists
    console.log('4. Possible issues:');
    console.log('   - RLS (Row Level Security) policy may be blocking inserts');
    console.log('   - barowner_id foreign key constraint may be failing');
    console.log('   - User may not have INSERT permission on venues table');
    console.log('   - Required fields may be missing');
    console.log('');

    // Test without barowner_id
    console.log('5. Testing venue creation WITHOUT barowner_id...');
    const testWithoutBarowner = { ...testVenueData };
    delete testWithoutBarowner.barowner_id;

    const { data: data2, error: error2 } = await supabase
      .from('venues')
      .insert([testWithoutBarowner])
      .select()
      .single();

    if (error2) {
      console.log('❌ Still failed without barowner_id:');
      console.log('Error:', error2.message);
    } else {
      console.log('✅ SUCCESS without barowner_id!');
      console.log('Created venue:', data2);
      console.log('');
      console.log('DIAGNOSIS: The issue is with the barowner_id field.');
      console.log('Possible causes:');
      console.log(
        '  1. Foreign key constraint failing (barowner_id references non-existent user)',
      );
      console.log('  2. RLS policy requires specific barowner_id value');
      console.log('  3. barowner_id column type mismatch');

      // Clean up test venue
      await supabase.from('venues').delete().eq('id', data2.id);
      console.log('Test venue cleaned up.');
    }
  } else {
    console.log('✅ SUCCESS! Venue created:');
    console.log(JSON.stringify(data, null, 2));

    // Clean up test venue
    await supabase.from('venues').delete().eq('id', data.id);
    console.log('Test venue cleaned up.');
  }

  console.log('\n=== Debug Complete ===');
}

debugVenueCreation().catch(console.error);
