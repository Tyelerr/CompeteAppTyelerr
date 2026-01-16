# Broadcast Push Notification - Deployment Guide

## ✅ Implementation Status

The `send-push` Edge Function is already fully implemented with broadcast support!

### Features Implemented:

1. ✅ Deno-style imports (no Node/CommonJS)
2. ✅ Broadcast push notifications to all users
3. ✅ Targeted push notifications to specific user
4. ✅ Token hygiene (auto-disable invalid tokens)

## 📋 API Usage

### Broadcast to All Users

```javascript
const { data, error } = await supabase.functions.invoke('send-push', {
  body: {
    broadcast: true,
    title: 'New Tournament Alert!',
    body: 'Check out the latest tournaments in your area',
    data: { type: 'tournament', id: '123' },
  },
});
```

### Targeted Push to Specific User

```javascript
const { data, error } = await supabase.functions.invoke('send-push', {
  body: {
    user_id: 'user-uuid-here',
    title: 'Personal Notification',
    body: 'You have a new message',
    data: { type: 'message', id: '456' },
  },
});
```

## 🚀 Deployment Steps

### Option 1: Deploy via Supabase CLI (Recommended)

1. **Ensure Supabase CLI is installed**

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**

   ```bash
   supabase login
   ```

3. **Deploy the function**
   ```bash
   cd CompeteApp
   supabase functions deploy send-push --project-ref ofcroxehpuiylonrakrf
   ```

### Option 2: Deploy via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/ofcroxehpuiylonrakrf/functions
2. Click on `send-push` function
3. Click "Deploy new version"
4. Copy the entire contents of `CompeteApp/supabase/functions/send-push/index.ts`
5. Paste into the editor
6. Click "Deploy"

## 🧪 Testing

### Test Broadcast Push

```bash
cd CompeteApp
node test-broadcast-push.js
```

### Test Targeted Push

```bash
cd CompeteApp
node test-send-push.js
```

## 📊 Expected Response

### Success Response

```json
{
  "success": true,
  "message": "Sent 5/5 notifications successfully",
  "tokens_sent": 5,
  "tokens_successful": 5,
  "tokens_disabled": 0,
  "results": [
    {
      "token_id": "token-uuid",
      "device_name": "iPhone 14",
      "device_os": "iOS",
      "status": "ok"
    }
  ]
}
```

### No Tokens Response

```json
{
  "success": true,
  "message": "No active push tokens found",
  "tokens_sent": 0
}
```

## 🔍 Monitoring

After deployment, check the function logs:

1. Go to: https://supabase.com/dashboard/project/ofcroxehpuiylonrakrf/functions/send-push/logs
2. Look for:
   - "Broadcasting push notification to all users" (for broadcast)
   - "Sending push notification to user X" (for targeted)
   - "Found X active tokens"
   - "Disabling invalid token" (if any tokens are invalid)

## ⚠️ Important Notes

1. **Broadcast sends to ALL users** - Use carefully for important announcements only
2. **Token hygiene is automatic** - Invalid tokens are automatically disabled
3. **Rate limits** - Expo has rate limits, be mindful when broadcasting to large user bases
4. **Data payload** - Keep the `data` object small (< 4KB recommended)

## 🎯 Next Steps

1. Deploy the function using one of the methods above
2. Test with a broadcast notification
3. Verify logs show successful delivery
4. Integrate into your app for:
   - New tournament announcements
   - New giveaway alerts
   - System-wide notifications
   - Marketing campaigns

## 📝 Example Integration

```typescript
// In your app code
import { supabase } from './ApiSupabase/supabase';

// Broadcast new tournament
async function notifyNewTournament(tournament) {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: {
      broadcast: true,
      title: 'New Tournament!',
      body: `${tournament.name} at ${tournament.venue_name}`,
      data: {
        type: 'tournament',
        tournament_id: tournament.id,
        screen: 'TournamentDetails',
      },
    },
  });

  if (error) {
    console.error('Failed to send broadcast:', error);
  } else {
    console.log(`Broadcast sent to ${data.tokens_sent} devices`);
  }
}

// Notify specific user
async function notifyUser(userId, title, body) {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: {
      user_id: userId,
      title,
      body,
      data: { type: 'notification' },
    },
  });

  if (error) {
    console.error('Failed to send notification:', error);
  }
}
```

## ✅ Deployment Complete!

Once deployed, the function will be available at:
`https://ofcroxehpuiylonrakrf.supabase.co/functions/v1/send-push`
