const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ofcroxehpuiylonrakrf.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGiveawayNotification() {
  try {
    console.log('Testing giveaway notification...');

    // First, let's create a test giveaway
    const { data: giveaway, error: createError } = await supabase
      .from('giveaways')
      .insert({
        title: 'Test Giveaway for Push Notifications',
        description: 'Testing push notification functionality',
        prize_value: 50,
        prize_description: 'Test prize',
        created_by: '03be7621-c7ad-49d0-88bb-5023d19236d8', // Test user ID
        venue_id: 'test-venue-id',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating test giveaway:', createError);
      return;
    }

    console.log('Created test giveaway:', giveaway.id);

    // Now call the notify-new-giveaway function
    const { data, error } = await supabase.functions.invoke(
      'notify-new-giveaway',
      {
        body: {
          giveaway_id: giveaway.id,
        },
      },
    );

    if (error) {
      console.error('Error calling notify-new-giveaway:', error);
      return;
    }

    console.log('Notification response:', JSON.stringify(data, null, 2));

    // Clean up - delete the test giveaway
    await supabase.from('giveaways').delete().eq('id', giveaway.id);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testGiveawayNotification();
