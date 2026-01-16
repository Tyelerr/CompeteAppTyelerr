/**
 * Script to get user_id from username and test send-push Edge Function
 * Run with: node get-user-id-and-test-push.js
 */

require('dotenv').config({ path: __dirname + '/.env' });

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

/* ---------------- ENV SETUP ---------------- */

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('DEBUG SUPABASE_URL =', SUPABASE_URL);
console.log('DEBUG HAS KEY =', !!SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.error(
    'Please set SUPABASE_URL / SUPABASE_ANON_KEY (or EXPO_PUBLIC equivalents)',
  );
  process.exit(1);
}

/* ---------------- CONFIG ---------------- */

const username = 'Tmoneyhill';

/* ---------------- SUPABASE CLIENT ---------------- */

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------- MAIN LOGIC ---------------- */

async function getUserIdAndTest() {
  try {
    console.log('');
    console.log('🔍 Looking up user_id for username:', username);
    console.log('');

    // 🔑 FIXED: profiles table uses user_name (NOT username)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, user_name')
      .eq('user_name', username)
      .single();

    if (error) {
      console.error('❌ Error fetching user profile:', error);
      process.exit(1);
    }

    if (!profile) {
      console.error('❌ User not found with username:', username);
      process.exit(1);
    }

    const userId = profile.id;

    console.log('✅ Found user!');
    console.log('   User ID:', userId);
    console.log('   Username:', profile.user_name);
    console.log('');

    /* -------- PUSH TOKENS -------- */

    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', userId)
      .is('disabled_at', null);

    if (tokenError) {
      console.error('⚠️ Error fetching push tokens:', tokenError);
    } else {
      console.log(`📱 Active push tokens: ${tokens?.length || 0}`);

      if (tokens?.length) {
        tokens.forEach((token, i) => {
          console.log(`   Token ${i + 1}:`);
          console.log(`     Device: ${token.device_name || 'Unknown'}`);
          console.log(`     OS: ${token.device_os || 'Unknown'}`);
          console.log(`     Token: ${token.token.substring(0, 20)}...`);
        });
      } else {
        console.log('   ⚠️ No active push tokens found');
      }
      console.log('');
    }

    /* -------- TEST EDGE FUNCTION -------- */

    console.log('🚀 Testing send-push Edge Function');
    console.log('');

    const payload = {
      user_id: userId,
      title: 'Test Notification',
      body: 'This is a test push notification from Node!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    const url = `${SUPABASE_URL}/functions/v1/send-push`;

    console.log('📍 URL:', url);
    console.log('📝 Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';

      console.log('📡 Response Status:', res.statusCode);
      console.log('');

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log('✅ Response:');
          console.log(JSON.stringify(response, null, 2));
        } catch {
          console.log('❌ Non-JSON response:');
          console.log(body);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request failed:', err.message);
    });

    req.write(JSON.stringify(payload));
    req.end();
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

getUserIdAndTest();
