p; // Debug script to test giveaway entry functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugGiveawayEntry() {
  console.log('🔍 Debugging Giveaway Entry System\n');

  // 1. Check if user is authenticated
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    console.log('❌ User not authenticated');
    console.log('Please log in first');
    return;
  }
  console.log('✅ User authenticated:', authData.user.id);

  // 2. Get active giveaways
  const { data: giveaways, error: giveawaysError } = await supabase
    .from('giveaways')
    .select('*')
    .eq('status', 'active')
    .limit(1);

  if (giveawaysError) {
    console.log('❌ Error fetching giveaways:', giveawaysError.message);
    return;
  }

  if (!giveaways || giveaways.length === 0) {
    console.log('❌ No active giveaways found');
    return;
  }

  const giveaway = giveaways[0];
  console.log('\n✅ Found active giveaway:', giveaway.title);
  console.log('   ID:', giveaway.id);
  console.log('   Single Entry:', giveaway.single_entry);
  console.log('   Max Entries:', giveaway.maximum_entries);

  // 3. Check existing entries for this user
  const { data: existingEntries, error: entriesError } = await supabase
    .from('giveaway_entries')
    .select('*')
    .eq('giveaway_id', giveaway.id)
    .eq('user_id', authData.user.id);

  if (entriesError) {
    console.log('❌ Error checking existing entries:', entriesError.message);
  } else {
    console.log(
      '\n📊 Existing entries for this user:',
      existingEntries?.length || 0,
    );
    if (existingEntries && existingEntries.length > 0) {
      console.log('   Entry details:', existingEntries[0]);
    }
  }

  // 4. Test the RPC function
  console.log('\n🧪 Testing fn_enter_giveaway RPC...');
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'fn_enter_giveaway',
    {
      p_giveaway_id: giveaway.id,
      p_agree_18: true,
      p_agree_rules: true,
      p_agree_privacy: true,
      p_agree_one_entry: true,
      p_marketing_opt_in: false,
      p_full_name: 'Test User',
      p_birthday: '1990-01-01',
    },
  );

  console.log('\n📤 RPC Response:');
  console.log('   Error:', rpcError);
  console.log('   Data:', JSON.stringify(rpcData, null, 2));

  // 5. Check entries again after RPC call
  const { data: afterEntries, error: afterError } = await supabase
    .from('giveaway_entries')
    .select('*')
    .eq('giveaway_id', giveaway.id)
    .eq('user_id', authData.user.id);

  if (!afterError) {
    console.log('\n📊 Entries after RPC call:', afterEntries?.length || 0);
    if (afterEntries && afterEntries.length > 0) {
      console.log('   Latest entry:', afterEntries[afterEntries.length - 1]);
    }
  }

  // 6. Check the view
  const { data: viewData, error: viewError } = await supabase
    .from('v_giveaways_with_counts')
    .select('*')
    .eq('id', giveaway.id)
    .single();

  if (!viewError && viewData) {
    console.log('\n📊 Giveaway count from view:', viewData.entries_count);
  }
}

debugGiveawayEntry()
  .then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });
