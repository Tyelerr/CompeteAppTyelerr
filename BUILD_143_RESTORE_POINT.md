# Build 143 - Restore Point Documentation

**Date Created:** December 2024  
**Build Number:** 143 (iOS & Android)  
**App Version:** 1.0.2

## Purpose

This document serves as a restore point for Build 143. It captures the current stable state of the application, including all configurations, recent fixes, and known working features. Use this as a reference if you need to understand what was working at this point or to roll back changes.

---

## Build Configuration

### app.json Settings

```json
{
  "expo": {
    "name": "Compete",
    "slug": "app",
    "version": "1.0.2",
    "ios": {
      "buildNumber": "143"
    },
    "android": {
      "versionCode": 143
    }
  }
}
```

### Bundle Identifiers

- **iOS:** com.tyelerr.app
- **Android:** com.tyelerr.app

---

## Recent Major Fixes (Builds 140-142)

### Build 140

- **Tournament Admin Display Fix**
- Fixed tournament visibility for admin users
- Updated CrudTournament.tsx for proper admin access

### Build 142

- **Recurring Tournament Horizon Implementation**
- Added 90-day horizon for recurring tournament generation
- Prevents excessive future tournament creation
- Database functions updated for proper archival

---

## Current Working Features

### Authentication & User Management

✅ Username/email login working
✅ User registration with validation
✅ Profile editing with secure email updates
✅ Password update functionality
✅ Avatar management (no reset issues)

### Tournament System

✅ Tournament creation and editing
✅ Tournament filtering (location, date, game type)
✅ Recurring tournament generation with horizon
✅ Tournament archival system
✅ Tournament director assignment (multiple TDs supported)
✅ Tournament likes/favorites tracking

### Giveaway System

✅ Giveaway creation and management
✅ Entry system with email/phone collection
✅ Winner selection functionality
✅ Single-entry enforcement
✅ Giveaway archival for expired items

### Venue Management

✅ Venue creation (bar owners)
✅ Venue search and filtering
✅ Tournament director assignment to venues
✅ Address-based location system

### Admin Features

✅ User management
✅ Tournament management
✅ Venue oversight
✅ Featured content management (players & bars)

---

## Database Schema Status

### Key Tables

- `profiles` - User profiles with active status
- `tournaments` - Active tournaments
- `tournaments_archive` - Archived tournaments
- `giveaways` - Active giveaways
- `giveaways_archive` - Archived giveaways
- `venues` - Venue information
- `venue_tournament_directors` - TD assignments
- `featured_players` - Featured player content
- `featured_bars` - Featured bar content

### Important RLS Policies

- Login/registration policies allow anonymous access
- Profile updates restricted to authenticated users
- Tournament creation requires authentication
- Admin operations require admin role
- Venue creation requires bar owner role

---

## Known Working SQL Functions

### Tournament Management

- `fn_archive_old_tournaments()` - Archives past tournaments
- `fn_generate_recurring_tournaments()` - Creates recurring instances with 90-day horizon
- `fn_cleanup_archived_tournament_likes()` - Removes likes for archived tournaments

### Giveaway Management

- `fn_enter_giveaway()` - Handles giveaway entries with email/phone
- `fn_archive_expired_giveaways()` - Archives past giveaways

---

## Environment Variables (EAS Secrets)

Required secrets configured in EAS:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for edge functions only)

---

## Edge Functions Deployed

### update-user-email

- Handles secure email updates with password verification
- Deployed via Supabase Dashboard
- Requires password confirmation before email change

---

## File Structure Highlights

### Critical Files

- `CompeteApp/app.json` - Build configuration
- `CompeteApp/eas.json` - EAS build settings
- `CompeteApp/App.tsx` - Main app entry point
- `CompeteApp/index.js` - App registration

### Key API Files

- `ApiSupabase/CrudUser.tsx` - User operations
- `ApiSupabase/CrudTournament.tsx` - Tournament operations
- `ApiSupabase/CrudGiveaway.tsx` - Giveaway operations
- `ApiSupabase/CrudVenues.tsx` - Venue operations
- `ApiSupabase/supabase.tsx` - Supabase client configuration

### Important Screens

- `screens/ProfileLogged/` - User profile management
- `screens/Billiard/` - Tournament browsing and filtering
- `screens/Shop/` - Giveaway and venue management
- `screens/Admin/` - Admin dashboard and tools

---

## How to Use This Restore Point

### To Reference Current State

1. Review this document to understand what was working at Build 143
2. Check the specific files mentioned for implementation details
3. Refer to the BUILD_142_RECURRING_TOURNAMENT_HORIZON_COMPLETE.md for the most recent major changes

### To Roll Back to This State

1. Use Git to checkout the commit associated with Build 143
2. Restore app.json with buildNumber "143" and versionCode 143
3. Ensure all environment variables are properly configured in EAS
4. Verify database schema matches the documented state
5. Redeploy edge functions if needed

### To Build from This Point

```bash
# For iOS
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production

# For both
eas build --platform all --profile production
```

---

## Testing Checklist for Build 143

When verifying this build works correctly:

- [ ] User can register new account
- [ ] User can login with username or email
- [ ] User can edit profile (name, bio, location, etc.)
- [ ] User can update email with password verification
- [ ] User can update password
- [ ] Tournaments display correctly with filters
- [ ] Tournament creation works for authenticated users
- [ ] Recurring tournaments generate properly (90-day horizon)
- [ ] Giveaways can be created and entered
- [ ] Winner selection works for giveaways
- [ ] Venues can be created by bar owners
- [ ] Tournament directors can be assigned to venues
- [ ] Admin users can manage all content
- [ ] Featured content displays on home screen

---

## Important Notes

### What's Working Well

- All authentication flows are stable
- Tournament system is robust with proper archival
- Giveaway system handles entries and winners correctly
- Admin tools are functional
- Database RLS policies are properly configured

### Areas to Monitor

- Recurring tournament generation (ensure horizon is respected)
- Giveaway archival (runs automatically for expired items)
- Tournament archival (runs automatically for past tournaments)
- Edge function performance for email updates

### Recent Improvements

- Added 90-day horizon to prevent excessive recurring tournament creation
- Fixed tournament display for admin users
- Improved RLS policies for better security
- Enhanced giveaway entry system with contact information

---

## Contact & Support

If you need to restore to this point or have questions about this build:

1. Reference this document for the known working state
2. Check Git history for the exact commit
3. Review related BUILD\_\*.md files for detailed change logs
4. Ensure all database migrations are applied in order

---

## Version History Reference

- Build 142: Recurring tournament horizon implementation
- Build 140: Tournament admin display fix
- Build 139: Multiple tournament director support
- Build 138: TD assignment database improvements
- Build 137: Time period filter implementation

**This is a stable, production-ready build with all major features working correctly.**
