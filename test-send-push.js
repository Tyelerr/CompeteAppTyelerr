#!/usr/bin/env node

/**
 * Test script for the send-push Edge Function
 * Usage: node test-send-push.js <user_id>
 */

const https = require('https');
const http = require('http');

// Replace with your Supabase project URL and anon key
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node test-send-push.js <user_id>');
  console.error(
    'Example: node test-send-push.js 123e4567-e89b-12d3-a456-426614174000',
  );
  process.exit(1);
}

const payload = {
  user_id: userId,
  title: 'Test Notification',
  body: 'This is a test push notification from the send-push Edge Function!',
  data: {
    type: 'test',
    timestamp: new Date().toISOString(),
  },
};

const url = `${SUPABASE_URL}/functions/v1/send-push`;

console.log('🚀 Testing send-push Edge Function');
console.log('📍 URL:', url);
console.log('👤 User ID:', userId);
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
  let data = '';

  console.log('📡 Response Status:', res.statusCode);
  console.log('📡 Response Headers:', res.headers);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('');
      console.log('✅ Response:');
      console.log(JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('');
        console.log('🎉 Push notification sent successfully!');
        console.log(`📊 Tokens sent: ${response.tokens_sent}`);
        console.log(`✅ Tokens successful: ${response.tokens_successful}`);
        if (response.tokens_disabled > 0) {
          console.log(
            `🗑️  Invalid tokens disabled: ${response.tokens_disabled}`,
          );
        }
      } else {
        console.log('');
        console.log('❌ Failed to send push notification');
      }
    } catch (e) {
      console.log('');
      console.log('❌ Failed to parse response JSON:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(JSON.stringify(payload));
req.end();
