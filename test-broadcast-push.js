const { createClient } = require('@supabase/supabase-js');

const supabaseUrl =
  process.env.SUPABASE_URL || 'https://ofcroxehpuiylonrakrf.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBroadcastPush() {
  console.log('🚀 Testing Broadcast Push Notification...\n');

  try {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        broadcast: true,
        title: '🎉 Test Broadcast Notification',
        body: 'This is a test broadcast to all users with active push tokens!',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
          screen: 'Home',
        },
      },
    });

    if (error) {
      console.error('❌ Error sending broadcast:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Broadcast sent successfully!\n');
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    if (data.tokens_sent === 0) {
      console.log('\n⚠️  No active push tokens found. Make sure:');
      console.log('   1. Users have enabled push notifications in the app');
      console.log('   2. Push tokens are being saved to the database');
      console.log('   3. Tokens have not been disabled');
    } else {
      console.log(
        `\n✅ Broadcast delivered to ${data.tokens_successful}/${data.tokens_sent} devices`,
      );

      if (data.tokens_disabled > 0) {
        console.log(
          `⚠️  ${data.tokens_disabled} invalid tokens were automatically disabled`,
        );
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the test
testBroadcastPush();
