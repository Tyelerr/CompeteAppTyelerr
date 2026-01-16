# Search Alerts - Final Fixes and Testing Plan

## 🔧 Required Fixes Before Deployment

### 1. Standardize Tournament Identifier

**Decision:** Use `tournaments.uuid` consistently

**Changes Needed:**

- ✅ Edge Function already uses `tournament.uuid`
- ✅ `search_alert_matches.tournament_id` already references UUID
- ✅ Test SQL examples use UUID
- **Status:** Already consistent

### 2. Fix Client Token Registration

**Current Issue:** Missing projectId and incorrect async usage

**Corrected Code:**

```typescript
import Constants from 'expo-constants';

// Get Expo push token with projectId
const token = (
  await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })
).data;

// Fix: Device.deviceName is NOT async
const deviceName = Device.deviceName || `${Platform.OS} Device`;
```

### 3. Add Android Notification Channel

**Add to client code:**

```typescript
// Configure Android notification channel
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('tournament-alerts', {
    name: 'Tournament Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}
```

### 4. Fix Edge Function Invocation

**Current Issue:** Documentation shows Bearer token with anon key

**Correct Approach:**

```typescript
// Client calls with user JWT (automatically included)
const { data, error } = await supabase.functions.invoke(
  'match-tournament-alerts',
  {
    body: { tournament_id: tournamentUuid },
  },
);
// Edge Function uses service role internally for full DB access
```

### 5. Use Supabase Scheduled Edge Functions

**Instead of pg_cron, create:**

```typescript
// supabase/functions/scheduled-tournament-matcher/index.ts
serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find recent tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('uuid')
    .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .eq('status', 'approved');

  // Match each tournament
  for (const tournament of tournaments || []) {
    await supabase.functions.invoke('match-tournament-alerts', {
      body: { tournament_id: tournament.uuid },
    });
  }

  return new Response(JSON.stringify({ matched: tournaments?.length || 0 }));
});
```

**Schedule in Supabase Dashboard:**

- Go to Edge Functions → Scheduled Functions
- Set cron: `*/5 * * * *` (every 5 minutes)

---

## ✅ End-to-End Test Plan

### Test 1: Basic Match and Deduplication

**Step 1:** Create alert

```sql
INSERT INTO search_alerts (user_id, alert_name, game_type, city, state, max_entry_fee, is_enabled)
VALUES (
  'YOUR_USER_UUID',
  'Phoenix 9-Ball Under $50',
  '9-Ball',
  'Phoenix',
  'AZ',
  50,
  true
) RETURNING id;
```

**Step 2:** Ensure push token exists

```sql
SELECT * FROM push_tokens WHERE user_id = 'YOUR_USER_UUID' AND disabled_at IS NULL;
```

**Step 3:** Create matching tournament

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
) RETURNING uuid;
```

**Step 4:** Call matcher (from client with user JWT)

```typescript
const { data } = await supabase.functions.invoke('match-tournament-alerts', {
  body: { tournament_id: 'UUID_FROM_STEP_3' },
});
console.log(data); // Should show matches_found: 1, pushes_sent: 1
```

**Expected Results:**

- ✅ Exactly 1 push notification received on device
- ✅ Entry in `search_alert_matches` with `push_status='sent'`
- ✅ `push_sent_at` timestamp set

**Step 5:** Re-run matcher with same tournament_id

**Expected Results:**

- ✅ NO duplicate push
- ✅ Response shows `matches_found: 0` (already matched)
- ✅ No new entry in `search_alert_matches` (UNIQUE constraint)

### Test 2: Case-Insensitive Matching

**Step 1:** Create alert with lowercase

```sql
INSERT INTO search_alerts (user_id, alert_name, city, state, is_enabled)
VALUES ('YOUR_USER_UUID', 'Case Test', 'phoenix', 'az', true);
```

**Step 2:** Create tournament with mixed case

```sql
INSERT INTO tournaments (uuid, tournament_name, city, state, status)
VALUES (gen_random_uuid(), 'Case Test Tournament', 'Phoenix', 'AZ', 'approved')
RETURNING uuid;
```

**Step 3:** Run matcher

**Expected Results:**

- ✅ Match found ("phoenix" = "Phoenix", "az" = "AZ")
- ✅ Push sent

### Test 3: Location Text Search

**Step 1:** Create alert

```sql
INSERT INTO search_alerts (user_id, alert_name, location_text, is_enabled)
VALUES ('YOUR_USER_UUID', 'Downtown Test', 'downtown', true);
```

**Step 2:** Create tournament

```sql
INSERT INTO tournaments (uuid, tournament_name, address, status)
VALUES (gen_random_uuid(), 'Location Test', '123 Downtown Street', 'approved')
RETURNING uuid;
```

**Step 3:** Run matcher

**Expected Results:**

- ✅ Match found (ILIKE search, case-insensitive)
- ✅ Push sent

---

## 📋 Deployment Checklist

### Database:

- [ ] Apply `create_search_alerts_table.sql`
- [ ] Apply `create_push_tokens_table.sql`
- [ ] Apply `create_search_alert_matches_table.sql`
- [ ] Verify all 3 tables created

### Edge Functions:

- [ ] Deploy `match-tournament-alerts`
- [ ] Set env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Test with supabase.functions.invoke()

### Client:

- [ ] Install: `npx expo install expo-notifications expo-device expo-constants`
- [ ] Create PushNotifications.tsx with fixes above
- [ ] Add Android channel setup
- [ ] Integrate in auth flow
- [ ] Test token registration

### Triggering:

- [ ] Choose: On-create OR Scheduled
- [ ] Implement chosen option
- [ ] Test triggering works

### Testing:

- [ ] Run Test 1: Basic + Deduplication
- [ ] Run Test 2: Case-insensitive
- [ ] Run Test 3: Location text
- [ ] Verify all pass

---

## 🎯 Summary of Deliverables

**Database:** 3 tables (search_alerts, push_tokens, search_alert_matches)
**Edge Function:** match-tournament-alerts with case-insensitive matching
**Client Code:** Template provided (needs fixes above)
**Documentation:** Complete implementation guide
**Testing:** 3 acceptance tests defined

**Status:** Core implementation complete, minor fixes needed before deployment
