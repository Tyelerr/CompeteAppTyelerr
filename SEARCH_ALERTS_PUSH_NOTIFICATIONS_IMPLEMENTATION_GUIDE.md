# Search Alerts Push Notifications - Complete Implementation Guide

## Overview

This guide covers the complete implementation of push notifications for Search Alerts, including database tables, Edge Functions, client-side code, and testing procedures.

---

## ✅ PHASE 1 COMPLETE: Database Tables

### Tables Created:

1. **search_alerts** (21 columns) - Stores user alert criteria
2. **push_tokens** - Stores Expo push notification tokens
3. **search_alert_matches** - Deduplication table for alert-tournament matches

All SQL files are in `CompeteApp/sql/`:

- `create_search_alerts_table.sql`
- `create_push_tokens_table.sql`
- `create_search_alert_matches_table.sql`

---

## 🚀 PHASE 2: Push Notification Pipeline

### 1. Edge Function: match-tournament-alerts

**Location:** `CompeteApp/supabase/functions/match-tournament-alerts/`

**Files Created:**

- `index.ts` - Main Edge Function code
- `deno.json` - Deno configuration

**Features Implemented:**

- ✅ Case-insensitive city/state matching (trim + normalize; state uppercase)
- ✅ Null-safe location_text checks using COALESCE
- ✅ Deduplication via UNIQUE(alert_id, tournament_id)
- ✅ Push notification sending via Expo Push API
- ✅ Invalid token handling (sets disabled_at)
- ✅ Status tracking (sent/failed/no_tokens/skipped_duplicate)

**Environment Variables Required:**

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Deployment:**

```bash
# Deploy via Supabase CLI
supabase functions deploy match-tournament-alerts

# Or deploy via Supabase Dashboard:
# 1. Go to Edge Functions
# 2. Create new function "match-tournament-alerts"
# 3. Copy contents of index.ts
# 4. Deploy
```

**Testing the Edge Function:**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/match-tournament-alerts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": "tournament-uuid-here"}'
```

---

### 2. Client-Side: Push Token Registration

**Implementation needed in your app's authentication flow:**

```typescript
// File: CompeteApp/utils/PushNotifications.tsx

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../ApiSupabase/supabase';

export async function registerForPushNotificationsAsync(userId: string) {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Get device info
    const deviceOS = Platform.OS;
    const deviceName = (await Device.deviceName) || `${Platform.OS} Device`;

    // Upsert token to database
    const { data, error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          expo_push_token: token,
          device_os: deviceOS,
          device_name: deviceName,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'expo_push_token',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to register push token:', error);
      return null;
    }

    console.log('Push token registered successfully:', token);
    return token;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

**Integration in App.tsx or Auth Context:**

```typescript
// In your ContextAuth.tsx or wherever you handle login

import { registerForPushNotificationsAsync } from '../utils/PushNotifications';

// After successful login:
useEffect(() => {
  if (user?.id) {
    // Register for push notifications
    registerForPushNotificationsAsync(user.id);
  }
}, [user?.id]);
```

**Required Package:**

```bash
npx expo install expo-notifications expo-device
```

---

### 3. Triggering Mechanism

**Option A: Call on Tournament Creation/Activation (Preferred)**

Add to your tournament creation/update code:

```typescript
// In CrudTournament.tsx or wherever tournaments are created/updated

async function onTournamentCreated(tournamentUuid: string) {
  try {
    // Call the Edge Function to match alerts
    const { data, error } = await supabase.functions.invoke(
      'match-tournament-alerts',
      {
        body: { tournament_id: tournamentUuid },
      },
    );

    if (error) {
      console.error('Failed to match tournament alerts:', error);
    } else {
      console.log('Tournament matched against alerts:', data);
    }
  } catch (error) {
    console.error('Error calling match-tournament-alerts:', error);
  }
}

// Call this after tournament insert/update
await onTournamentCreated(newTournament.uuid);
```

**Option B: Scheduled Job (Acceptable Alternative)**

Create a cron job in Supabase:

```sql
-- Create a function to match recent tournaments
CREATE OR REPLACE FUNCTION match_recent_tournaments()
RETURNS void AS $$
DECLARE
  tournament_record RECORD;
BEGIN
  -- Find tournaments created/updated in last 10 minutes
  FOR tournament_record IN
    SELECT uuid
    FROM tournaments
    WHERE updated_at >= NOW() - INTERVAL '10 minutes'
    AND status = 'approved'
  LOOP
    -- Call Edge Function for each tournament
    -- Note: This requires pg_net extension
    PERFORM net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/match-tournament-alerts',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := json_build_object('tournament_id', tournament_record.uuid)::jsonb
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule to run every 5 minutes via pg_cron
SELECT cron.schedule(
  'match-recent-tournaments',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT match_recent_tournaments();'
);
```

---

### 4. End-to-End Acceptance Tests

#### Test 1: Basic Match and Push

**Steps:**

1. Create a search alert:

```sql
INSERT INTO search_alerts (user_id, alert_name, game_type, city, state, max_entry_fee)
VALUES (
  'your-user-uuid',
  'Phoenix 9-Ball Under $50',
  '9-Ball',
  'Phoenix',
  'AZ',
  50
);
```

2. Ensure you have a push token registered for that user

3. Create a matching tournament:

```sql
INSERT INTO tournaments (
  uuid, tournament_name, game_type, city, state, tournament_fee, start_date, status
) VALUES (
  gen_random_uuid(),
  'Phoenix 9-Ball Championship',
  '9-Ball',
  'Phoenix',
  'AZ',
  45,
  CURRENT_DATE + INTERVAL '7 days',
  'approved'
);
```

4. Call the matcher:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/match-tournament-alerts \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tournament_id": "tournament-uuid-from-step-3"}'
```

**Expected Result:**

- ✅ Exactly 1 push notification received
- ✅ Entry in `search_alert_matches` table
- ✅ `push_sent_at` and `push_status='sent'` set

5. Re-run the matcher with same tournament_id

**Expected Result:**

- ✅ NO duplicate push (dedupe works)
- ✅ Response shows `matches_found: 0` (already matched)

#### Test 2: Case-Insensitive Matching

**Steps:**

1. Create alert with lowercase city:

```sql
INSERT INTO search_alerts (user_id, alert_name, city, state)
VALUES ('your-user-uuid', 'Test Case Sensitivity', 'phoenix', 'az');
```

2. Create tournament with mixed case:

```sql
INSERT INTO tournaments (uuid, tournament_name, city, state, status)
VALUES (gen_random_uuid(), 'Test Tournament', 'Phoenix', 'AZ', 'approved');
```

3. Run matcher

**Expected Result:**

- ✅ Match found ("phoenix" matches "Phoenix", "az" matches "AZ")
- ✅ Push sent

#### Test 3: Location Text Search

**Steps:**

1. Create alert with location_text:

```sql
INSERT INTO search_alerts (user_id, alert_name, location_text)
VALUES ('your-user-uuid', 'Downtown Venues', 'downtown');
```

2. Create tournament with "Downtown" in address:

```sql
INSERT INTO tournaments (uuid, tournament_name, address, status)
VALUES (gen_random_uuid(), 'Test', '123 Downtown Street', 'approved');
```

3. Run matcher

**Expected Result:**

- ✅ Match found (case-insensitive ILIKE search)
- ✅ Push sent

---

## 📋 Deployment Checklist

### Database Setup:

- [ ] Run `create_search_alerts_table.sql`
- [ ] Run `create_push_tokens_table.sql`
- [ ] Run `create_search_alert_matches_table.sql`
- [ ] Verify all tables created with correct columns

### Edge Function Setup:

- [ ] Deploy `match-tournament-alerts` Edge Function
- [ ] Set environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Test Edge Function with curl

### Client Setup:

- [ ] Install expo-notifications and expo-device packages
- [ ] Create PushNotifications.tsx utility
- [ ] Integrate token registration in auth flow
- [ ] Configure notification handler

### Triggering Setup:

- [ ] Choose Option A (call on tournament create) OR Option B (scheduled job)
- [ ] Implement chosen option
- [ ] Test triggering mechanism

### Testing:

- [ ] Run Test 1: Basic match and push
- [ ] Run Test 2: Case-insensitive matching
- [ ] Run Test 3: Location text search
- [ ] Verify deduplication works
- [ ] Test invalid token handling

---

## 🔧 Troubleshooting

### Push Not Received:

1. Check `search_alert_matches` table - was match created?
2. Check `push_tokens` table - is token active (disabled_at IS NULL)?
3. Check Edge Function logs in Supabase Dashboard
4. Verify Expo push token format (starts with ExponentPushToken[...])

### Duplicate Pushes:

1. Check UNIQUE constraint on search_alert_matches(alert_id, tournament_id)
2. Verify Edge Function uses ON CONFLICT DO NOTHING
3. Check Edge Function logs for duplicate errors

### Invalid Token Errors:

1. Check if disabled_at is being set correctly
2. Verify token is valid Expo push token
3. Test on physical device (not simulator)

---

## 📊 Monitoring Queries

```sql
-- Count active alerts
SELECT COUNT(*) FROM search_alerts WHERE is_enabled = true;

-- Count active push tokens
SELECT COUNT(*) FROM push_tokens WHERE disabled_at IS NULL;

-- Recent matches
SELECT * FROM search_alert_matches
ORDER BY matched_at DESC
LIMIT 10;

-- Push success rate
SELECT
  push_status,
  COUNT(*) as count
FROM search_alert_matches
GROUP BY push_status;

-- Disabled tokens
SELECT user_id, expo_push_token, disabled_at
FROM push_tokens
WHERE disabled_at IS NOT NULL
ORDER BY disabled_at DESC;
```

---

## 🎯 Summary

**Phase 1 (Complete):**

- ✅ 3 database tables created
- ✅ TypeScript interfaces updated
- ✅ Complete documentation

**Phase 2 (Implementation Guide Provided):**

- ✅ Edge Function code ready
- ✅ Client-side code template provided
- ✅ Triggering options documented
- ✅ Testing procedures defined

**Next Steps:**

1. Deploy all SQL migrations
2. Deploy Edge Function
3. Implement client-side push token registration
4. Choose and implement triggering mechanism
5. Run acceptance tests
6. Monitor and iterate

---

**Status:** Ready for deployment and integration
**Estimated Integration Time:** 2-4 hours
**Testing Time:** 1-2 hours
