# Secure Email Update Implementation Plan

## Overview

Implementing a secure email update system that properly updates both Supabase Auth (auth.users) and app profile (profiles table) using Edge Functions with service role authentication.

## Critical Security Issue Fixed

❌ **REMOVED**: Service role key exposed in React Native app (major security vulnerability)
✅ **IMPLEMENTED**: Service role only used server-side in Edge Functions

## Implementation Steps

### Phase 1: Remove Security Vulnerability ✅

- [x] Remove EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY from client
- [x] Update supabase.tsx to remove supabaseAdmin client
- [x] Update CrudUser.tsx to remove supabaseAdmin usage

### Phase 2: Create Edge Function Infrastructure

- [ ] Create Supabase Edge Function: `update-user-email`
- [ ] Implement atomic transaction handling
- [ ] Add password re-authentication
- [ ] Handle email confirmation flow
- [ ] Add comprehensive error handling

### Phase 3: Update Client Code

- [ ] Create EdgeFunctionService.tsx for API calls
- [ ] Update CrudUser.tsx with new UpdateUserEmail function
- [ ] Update FormUserEditor.tsx to add password confirmation
- [ ] Add proper loading states and error messages

### Phase 4: Database & Security

- [ ] Create/update RLS policies for profiles table
- [ ] Add database trigger for consistency (optional)
- [ ] Document security model

### Phase 5: Testing & Documentation

- [ ] Create test script for email update flow
- [ ] Test email confirmation process
- [ ] Test error scenarios
- [ ] Create deployment guide
- [ ] Update user documentation

## Files to Create/Modify

### New Files:

1. `CompeteApp/supabase/functions/update-user-email/index.ts` - Edge Function
2. `CompeteApp/supabase/functions/update-user-email/deno.json` - Edge Function config
3. `CompeteApp/ApiSupabase/EdgeFunctionService.tsx` - Client API service
4. `CompeteApp/sql/email_update_rls_policies.sql` - Database policies
5. `CompeteApp/test_email_update.js` - Test script
6. `CompeteApp/EDGE_FUNCTION_DEPLOYMENT_GUIDE.md` - Deployment instructions

### Modified Files:

1. `CompeteApp/ApiSupabase/supabase.tsx` - Remove supabaseAdmin
2. `CompeteApp/ApiSupabase/CrudUser.tsx` - Update UpdateProfile, add UpdateUserEmail
3. `CompeteApp/screens/ProfileLogged/FormUserEditor.tsx` - Add password re-auth
4. `CompeteApp/.env.example` - Update environment variables documentation

## Security Improvements

✅ Service role key never exposed to client
✅ Password re-authentication required for email changes
✅ Atomic updates of auth.users and profiles
✅ Proper email confirmation flow
✅ Comprehensive error handling
✅ Email uniqueness validation

## Testing Checklist

- [ ] Email update with valid password
- [ ] Email update with invalid password
- [ ] Email update to existing email (should fail)
- [ ] Email confirmation process
- [ ] Login with old email (should fail after confirmation)
- [ ] Login with new email (should work after confirmation)
- [ ] Network failure scenarios
- [ ] Concurrent update attempts

## Deployment Steps

1. Deploy Edge Function to Supabase
2. Update environment variables (remove service role from client)
3. Deploy updated React Native app
4. Run database migrations
5. Test in production

## Status: IN PROGRESS

Current Step: Phase 1 - Removing Security Vulnerability
