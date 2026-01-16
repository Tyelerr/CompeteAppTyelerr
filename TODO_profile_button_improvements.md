# Profile Button Improvements

## Issues Fixed:

1. ✅ Edit Profile and Sign Out buttons are too large on the profile page
2. ✅ Admin dashboard logs user into newly created accounts automatically
3. ✅ Admin dashboard shows "Add to Venue" button for all user roles (should only be for Tournament Directors)
4. ✅ Tournament Director submit page shows confusing message when no venues assigned

## Profile Page Changes (COMPLETED):

- ✅ Made buttons smaller using 'small' size instead of 'compact'
- ✅ Removed flex: 1 containers that force full width
- ✅ Added better spacing and proportions with minWidth/maxWidth constraints
- ✅ Centered button layout with proper gap spacing

## Admin Dashboard Changes (COMPLETED):

- ✅ Fixed automatic login issue when creating new accounts
- ✅ Modified supabaseAdmin client to not persist sessions (persistSession: false)
- ✅ Disabled autoRefreshToken for admin client to prevent session interference
- ✅ Removed login(createdUser) call that was logging admin into newly created accounts
- ✅ Admin now stays logged in as admin after creating accounts
- ✅ Fixed "Add to Venue" button visibility - now only shows for Tournament Director roles
- ✅ Removed incorrect "Add to Venue" button for Basic Users and Compete Admins

## Technical Details:

- **PanelUserDetailsAndEditor.tsx**: Updated button layout with smaller size and better proportions
- **supabase.tsx**: Fixed supabaseAdmin client configuration to prevent session conflicts
- **ScreenAdminUsers.tsx**: Fixed role-based button visibility logic AND removed login(createdUser) call
- **LFDropdownTournamentDirectorVenues.tsx**: Updated message for Tournament Directors with no venue access

## Role-Based Button Logic (Fixed):

- **Bar Admin**: Shows "Add Venue" and "Add Tournament Director" buttons
- **Tournament Director**: Shows "Add to Venue" button (correct)
- **Basic User/Compete Admin**: No venue-related buttons (fixed)

## Tournament Director Message Improvement (Fixed):

**Old Message:**
"⚠️ No venues assigned to you as Tournament Director. Contact an administrator to get venue access."

**New Message:**
"⚠️ In order to create a tournament you would need to be assigned to a Bar. Please reach out to the Bar Owner and ensure they add you to their bar."
