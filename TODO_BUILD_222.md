# TODO - Build 223 Implementation Checklist

## ✅ Completed Tasks

- [x] Update build number from 220 to 223 in `app.json`
- [x] Migrate `CrudAlerts.tsx` from `alerts` to `search_alerts` table
- [x] Implement field mapping (legacy → new schema)
- [x] Add backward compatibility layer (`MapSearchAlertToIAlert`)
- [x] Create RLS verification script (`verify_search_alerts_rls.sql`)
- [x] Create Build 223 documentation

## ⏳ Pending Tasks

### 1. Database Verification

- [ ] Run `CompeteApp/sql/verify_search_alerts_rls.sql` in Supabase SQL Editor
- [ ] Confirm RLS is enabled on `search_alerts` table
- [ ] Confirm all 4 RLS policies exist and use `auth.uid() = user_id`
- [ ] Verify 21 columns exist in correct schema
- [ ] Verify 4 performance indexes exist
- [ ] Verify `updated_at` trigger is active

### 2. Development Testing

#### Alert CRUD Operations

- [ ] **Create Alert:** Test creating a new search alert
  - Verify alert is saved to `search_alerts` table
  - Verify all fields are correctly mapped
  - Verify `user_id` is set correctly
  - Verify `is_enabled` defaults to `true`
- [ ] **Read Alerts:** Test retrieving alerts
  - Verify only user's own alerts are returned
  - Verify alerts are ordered by `updated_at` DESC
  - Verify field mapping works (legacy fields populated)
- [ ] **Update Alert:** Test editing an existing alert
  - Verify changes are saved correctly
  - Verify `updated_at` timestamp is auto-updated
  - Verify all optional fields can be updated
- [ ] **Delete Alert:** Test deleting an alert
  - Verify alert is removed from `search_alerts`
  - Verify user can only delete their own alerts

#### RLS Security Testing

- [ ] Test with multiple users
- [ ] Verify User A cannot see User B's alerts
- [ ] Verify User A cannot edit User B's alerts
- [ ] Verify User A cannot delete User B's alerts
- [ ] Verify admin users also cannot bypass RLS

#### UI Testing

- [ ] Test `ProfileLoggedSearchAlerts` screen
  - Verify alerts display correctly
  - Verify "New Alert" button works
  - Verify Edit button works
  - Verify Delete button works
  - Verify pull-to-refresh works
- [ ] Test `ModalProfileAddAlert` modal
  - Verify all form fields work
  - Verify Create Alert saves correctly
  - Verify Update Alert saves correctly
  - Verify Cancel button works
  - Verify modal closes after save

### 3. Push Notification Pipeline Testing

- [ ] Create a tournament that matches an alert's criteria
- [ ] Verify Edge Function `match-tournament-alerts` triggers
- [ ] Verify push notification is sent to user
- [ ] Verify `search_alert_matches` table records the match
- [ ] Verify deduplication works (no duplicate notifications)
- [ ] Test with multiple alerts from same user
- [ ] Test with alerts from multiple users

### 4. Edge Cases Testing

- [ ] Test with all optional fields empty
- [ ] Test with all optional fields filled
- [ ] Test with partial field combinations
- [ ] Test date range filtering
- [ ] Test Fargo range filtering
- [ ] Test location text search
- [ ] Test city/state filtering
- [ ] Test with disabled alerts (`is_enabled = false`)

### 5. Deployment Preparation

- [ ] Review all code changes
- [ ] Ensure no references to legacy `alerts` table remain
- [ ] Verify Edge Function is using `search_alerts`
- [ ] Clear any cached data in development
- [ ] Test on physical iOS device (if possible)

### 6. TestFlight Deployment

- [ ] Build iOS app with EAS: `eas build --platform ios --profile production`
- [ ] Upload to TestFlight
- [ ] Test on TestFlight build
- [ ] Monitor for any errors or issues
- [ ] Verify push notifications work in production

### 7. Post-Deployment Monitoring

- [ ] Monitor Supabase logs for any errors
- [ ] Monitor Edge Function logs
- [ ] Check for any user-reported issues
- [ ] Verify alert creation/editing works in production
- [ ] Verify push notifications are being sent

### 8. Future Cleanup (Optional)

- [ ] After confirming Build 222 is stable (1-2 weeks)
- [ ] Consider dropping legacy `public.alerts` table
- [ ] Remove legacy field support from `IAlert` interface
- [ ] Simplify `CrudAlerts.tsx` (remove backward compatibility layer)

## Notes

### Critical Points

- ⚠️ **No data migration needed** - Legacy `alerts` table has only test data
- ⚠️ **RLS is strict** - Even admins cannot bypass user isolation
- ⚠️ **Backward compatibility** - UI uses legacy field names, CRUD layer handles mapping
- ⚠️ **Push pipeline unchanged** - Edge Function already uses `search_alerts`

### Testing Priority

1. **High Priority:** CRUD operations, RLS security
2. **Medium Priority:** UI functionality, field mapping
3. **Low Priority:** Edge cases, optional fields

### Rollback Plan

If issues are found:

1. Revert `CrudAlerts.tsx` to use `alerts` table
2. Revert build number to 220
3. Investigate and fix issues
4. Re-attempt migration

## Status

**Current Status:** Code complete, ready for testing

**Next Action:** Run database verification script and begin development testing

---

**Build:** 223
**Last Updated:** 2024
**Owner:** Development Team
