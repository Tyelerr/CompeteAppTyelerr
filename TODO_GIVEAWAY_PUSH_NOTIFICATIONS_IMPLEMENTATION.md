# Giveaway Push Notifications Implementation Plan

## Overview

Implement a complete push notification system that sends notifications to all users when a new giveaway is created.

## Current State Analysis

### ✅ Already Implemented

1. **Push Token Management**

   - `push_tokens` table exists with proper schema
   - `CrudPushTokens.tsx` handles token registration
   - Token registration happens on login/app start
   - `last_seen_at` updates are working
   - Foreground notification handler configured in `App.tsx`

2. **Send-Push Edge Function**

   - Located at `supabase/functions/send-push/index.ts`
   - Sends notifications to individual users
   - Handles token hygiene (disables invalid tokens)
   - Uses Expo Push Service
   - Currently only accepts `user_id` parameter (single user)

3. **Notification Permissions**
   - `registerForPushNotificationsAsync.tsx` handles permission requests
   - `NotificationUtils.tsx` provides helper functions
   - Permission status tracking implemented

### ❌ Missing Implementation

1. **Notification Tap Behavior**

   - No deep linking handler for notification taps
   - Need to route to Shop → Giveaways screen
   - Need to open specific giveaway from notification data

2. **Giveaway Creation Trigger**

   - Currently creates giveaway directly in client (`ModalCreateGiveaway.tsx`)
   - No server-side notification sending
   - No fanout logic to notify all users

3. **Fanout Logic**

   - No function to send to all active users
   - No chunking for Expo's batch limits
   - No deduplication by (user_id, token)

4. **Security**
   - `send-push` function needs auth restrictions
   - Need separate function for admin/server-side use

---

## Implementation Plan

### Phase 1: Add Notification Tap Behavior ✅

**Files to Modify:**

- `CompeteApp/App.tsx`
- `CompeteApp/navigation/AppNavigator.tsx` (if needed)

**Tasks:**

1. Add notification response listener in `App.tsx`
2. Handle `NEW_GIVEAWAY` notification type
3. Navigate to Shop tab → Giveaways screen
4. Open specific giveaway modal if `giveaway_id` provided

**Implementation:**

```typescript
// In App.tsx useEffect
useEffect(() => {
  // Listen for notification taps
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      if (data.type === 'NEW_GIVEAWAY') {
        // Navigate to Shop tab
        // Then open giveaway modal with data.giveaway_id
      }
    },
  );

  return () => subscription.remove();
}, []);
```

---

### Phase 2: Create Fanout Edge Function 🔧

**New File:**

- `CompeteApp/supabase/functions/notify-new-giveaway/index.ts`

**Purpose:**

- Query all active push tokens
- Deduplicate by (user_id, token)
- Send notifications in chunks (Expo limit: 100 per request)
- Log results and handle errors
- Mark invalid tokens as disabled

**Function Signature:**

```typescript
POST /notify-new-giveaway
Body: {
  giveaway_id: string,
  title: string,
  prize_value?: number
}
```

**Implementation Steps:**

1. Create new Edge Function directory
2. Query `push_tokens` where `disabled_at IS NULL`
3. Deduplicate tokens
4. Chunk into batches of 100
5. Send to Expo Push Service
6. Handle `DeviceNotRegistered` errors
7. Return summary (sent, failed, disabled)

**Security:**

- Only callable by service role OR authenticated admin
- Check user role before allowing execution

---

### Phase 3: Create Server-Side Giveaway Creation 🔧

**New File:**

- `CompeteApp/supabase/functions/create-giveaway/index.ts`

**Purpose:**

- Accept giveaway data from client
- Insert into `giveaways` table using service role
- Call `notify-new-giveaway` function
- Return created giveaway

**Function Signature:**

```typescript
POST /create-giveaway
Body: {
  // All giveaway fields from ModalCreateGiveaway
  title: string,
  description?: string,
  prize_value?: number,
  // ... etc
}
```

**Implementation Steps:**

1. Validate request (auth, required fields)
2. Insert giveaway with service role
3. Call `notify-new-giveaway` with giveaway details
4. Return created giveaway + notification summary

**Security:**

- Require authentication
- Check user has admin/bar_owner role
- Use service role for database operations

---

### Phase 4: Update Client to Use Edge Function 🔧

**Files to Modify:**

- `CompeteApp/screens/Shop/ModalCreateGiveaway.tsx`
- `CompeteApp/ApiSupabase/CrudGiveaway.tsx` (create new function)

**Tasks:**

1. Create `createGiveawayWithNotifications()` function
2. Call `create-giveaway` Edge Function instead of direct insert
3. Handle response and show notification summary
4. Update UI to show "Notifying users..." state

**Implementation:**

```typescript
// In CrudGiveaway.tsx
export async function createGiveawayWithNotifications(payload: any) {
  const { data, error } = await supabase.functions.invoke('create-giveaway', {
    body: payload,
  });

  return { data, error };
}

// In ModalCreateGiveaway.tsx
const onSubmit = async () => {
  // ... validation ...

  const { data, error } = await createGiveawayWithNotifications(payload);

  if (error) {
    Alert.alert('Create failed', error.message);
    return;
  }

  Alert.alert(
    'Success',
    `Giveaway created! Notified ${data.notifications_sent} users.`,
  );

  onCreated?.(data.giveaway);
  closeAndReset();
};
```

---

### Phase 5: Enhanced Send-Push Function 🔧

**File to Modify:**

- `CompeteApp/supabase/functions/send-push/index.ts`

**Tasks:**

1. Add support for broadcasting to all users
2. Add optional `user_ids` array parameter
3. Keep existing single `user_id` functionality
4. Add proper auth checks

**New Function Signature:**

```typescript
POST /send-push
Body: {
  user_id?: string,        // Single user (existing)
  user_ids?: string[],     // Multiple users (new)
  broadcast?: boolean,     // All users (new)
  title: string,
  body: string,
  data?: Record<string, any>
}
```

---

## Database Schema Verification

### push_tokens Table

```sql
-- Verify schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'push_tokens';

-- Expected columns:
-- id (uuid)
-- user_id (uuid)
-- token (text)
-- device_os (text)
-- device_name (text)
-- created_at (timestamp)
-- last_seen_at (timestamp)
-- disabled_at (timestamp, nullable)
```

### RLS Policies

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'push_tokens';

-- Check policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'push_tokens';
```

---

## Testing Plan

### 1. Test Notification Tap Behavior

- [ ] Send test notification with `NEW_GIVEAWAY` type
- [ ] Tap notification when app is closed
- [ ] Verify navigation to Shop → Giveaways
- [ ] Verify giveaway modal opens with correct ID

### 2. Test Fanout Function

- [ ] Create test with 5 users with active tokens
- [ ] Call `notify-new-giveaway` function
- [ ] Verify all 5 users receive notification
- [ ] Check logs for success count
- [ ] Test with invalid token (should disable it)

### 3. Test Create Giveaway Flow

- [ ] Create giveaway through new Edge Function
- [ ] Verify giveaway is created in database
- [ ] Verify notifications are sent
- [ ] Check notification summary in response

### 4. Test Security

- [ ] Try calling `notify-new-giveaway` without auth (should fail)
- [ ] Try calling as regular user (should fail)
- [ ] Try calling as admin (should succeed)

---

## Deployment Checklist

### Edge Functions

- [ ] Deploy `notify-new-giveaway` function
- [ ] Deploy `create-giveaway` function
- [ ] Update `send-push` function (if modified)
- [ ] Set environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

### Database

- [ ] Verify `push_tokens` table schema
- [ ] Verify RLS policies
- [ ] Add indexes if needed:

  ```sql
  CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
  ON push_tokens(user_id);

  CREATE INDEX IF NOT EXISTS idx_push_tokens_disabled_at
  ON push_tokens(disabled_at)
  WHERE disabled_at IS NULL;
  ```

### Client App

- [ ] Update `ModalCreateGiveaway.tsx`
- [ ] Add notification tap handler in `App.tsx`
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Deploy new build to TestFlight/Play Store

---

## Notification Content Specification

### Title

```
New Giveaway Added 🎁
```

### Body

```
Open Compete to enter now.
```

### Data Payload

```json
{
  "type": "NEW_GIVEAWAY",
  "giveaway_id": "<uuid>",
  "title": "Giveaway Title",
  "prize_value": 500
}
```

---

## Error Handling

### Client Errors

- Network failures → Show retry option
- Permission denied → Show settings link
- Invalid response → Log and show generic error

### Server Errors

- Database errors → Log and return 500
- Expo API errors → Log, disable invalid tokens, continue
- Auth errors → Return 401/403

### Token Hygiene

- `DeviceNotRegistered` → Set `disabled_at = NOW()`
- `InvalidCredentials` → Set `disabled_at = NOW()`
- Other errors → Log but don't disable

---

## Performance Considerations

### Chunking Strategy

- Expo limit: 100 notifications per request
- Chunk tokens into batches of 100
- Send batches sequentially (avoid rate limits)
- Add 100ms delay between batches

### Database Queries

- Use indexes on `user_id` and `disabled_at`
- Limit query to active tokens only
- Consider pagination for very large user bases

### Logging

- Log total tokens found
- Log successful sends
- Log failed sends
- Log disabled tokens
- Return summary to caller

---

## Future Enhancements

1. **Scheduled Notifications**

   - Notify users X hours before giveaway ends
   - Remind users to claim prizes

2. **Personalized Notifications**

   - Based on user preferences
   - Based on past giveaway entries

3. **Analytics**

   - Track notification open rates
   - Track conversion to entries

4. **A/B Testing**
   - Test different notification copy
   - Test different send times

---

## Implementation Priority

### Must Have (Phase 1)

1. ✅ Notification tap behavior
2. ✅ Fanout Edge Function
3. ✅ Server-side giveaway creation
4. ✅ Client integration

### Nice to Have (Phase 2)

1. Notification preferences per user
2. Quiet hours support
3. Notification history
4. Analytics dashboard

### Future (Phase 3)

1. Scheduled notifications
2. Personalized content
3. A/B testing framework
4. Advanced analytics

---

## Notes

- Expo Push Service is free for up to 1M notifications/month
- Notifications require physical device (won't work in simulator)
- iOS requires Apple Developer account with push notification capability
- Android requires Firebase Cloud Messaging setup (handled by Expo)
- Test thoroughly on both platforms before production deployment
