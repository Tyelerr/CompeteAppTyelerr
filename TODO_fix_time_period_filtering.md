# Fix Tournament Likes Time Period Filtering

## Problems Identified:

1. **Database Issues:**

   - Multiple conflicting SQL functions with different parameter types (TEXT vs VARCHAR)
   - Missing or empty `tournament_likes_history` table
   - Triggers may not be properly set up to populate historical data
   - Function conflicts causing PGRST203 errors

2. **API Issues:**

   - Data parsing inconsistencies in `GetVenueTournamentLikesStatsByPeriod`
   - Error handling may not be properly surfacing database issues

3. **Frontend Issues:**
   - Multiple dashboard versions with different implementations
   - Potential state management issues with time period changes

## Solution Steps:

### Step 1: Fix Database (CRITICAL)

- Run the comprehensive SQL fix: `fix_tournament_likes_time_filtering_complete.sql`
- This will:
  - Clean up all conflicting functions
  - Ensure proper table structure
  - Set up triggers for historical data tracking
  - Populate existing likes as historical data
  - Create a single, working function with proper error handling

### Step 2: Update API Function (if needed)

- Enhance error logging in `GetVenueTournamentLikesStatsByPeriod`
- Add better data validation and parsing

### Step 3: Fix Frontend Implementation

- Ensure the dashboard properly handles API responses
- Add error handling for failed API calls
- Improve state management for time period changes

### Step 4: Testing

- Test each time period (24hr, 1week, 1month, 1year, lifetime)
- Verify data changes when switching periods
- Check error handling

## Files to Execute/Update:

1. `CompeteApp/sql/fix_tournament_likes_time_filtering_complete.sql` (EXECUTE FIRST)
2. `CompeteApp/ApiSupabase/CrudTournament.tsx` (update if needed)
3. `CompeteApp/screens/BarOwner/ScreenBarOwnerDashboard_fixed.tsx` (verify implementation)
