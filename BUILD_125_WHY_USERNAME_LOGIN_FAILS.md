# Why Username Login Fails (And How Build 125 Fixes It)

## The Real Problem

**You're testing in TestFlight with an OLD build** (Build 123 or earlier) that has the BROKEN code.

Build 125 with the username login fix has NOT been deployed to TestFlight yet!

## How Username Login Works

1. **User enters username** (e.g., "tbar")
2. **App looks up username in `profiles` table** to get the email
3. **App uses the email to authenticate** with `auth.users`
4. **Login succeeds**

## Why It's Failing in TestFlight

The OLD code (Build 123) has this BROKEN query:

```typescript
.ilike('user_name', username)
.neq('status', 'deleted')  // ❌ BROKEN - excludes users with status='active'
```

This excludes users where status = 'active', which is why:

- ✅ tmoneyhill works (probably has status = NULL)
- ❌ tbar fails (has status = 'active')
- ❌ MetroSportzBar fails (has status = 'active')

## Build 125 Fix

The NEW code (Build 125) has this FIXED query:

```typescript
.ilike('user_name', username)
.or('status.is.null,status.neq.deleted')  // ✅ FIXED - includes all non-deleted users
```

This correctly includes users with NULL or 'active' status.

## Why Email Login Works

Email login bypasses the profiles table lookup entirely:

1. User enters email
2. App authenticates directly with `auth.users`
3. Login succeeds

That's why email login works for everyone, but username login only works for tmoneyhill.

## The Solution

**Deploy Build 125 to TestFlight!**

```powershell
cd CompeteApp
eas build --platform ios --profile production
eas submit --platform ios
```

Once Build 125 is in TestFlight, username login will work for ALL users.

## Important Note About auth.users

The `auth.users` table does NOT have a `user_name` column. It only has:

- id (UUID)
- email
- encrypted_password
- email_confirmed_at
- etc.

The `user_name` is ONLY in the `profiles` table. That's why the app must:

1. Look up username in `profiles` to get email
2. Use email to authenticate with `auth.users`

Build 125 fixes step #1 so it finds all users correctly.
