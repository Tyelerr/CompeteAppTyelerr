# Venue Performance Testing Guide

This guide explains how to test the venue performance and time period filtering functionality in the Bar Owner Dashboard using mock data.

## Files Created

1. **`sql/insert_mock_venue_performance_data.sql`** - Creates comprehensive mock data for testing
2. **`sql/test_venue_performance.sql`** - Verification queries to check the data
3. This README file

## What the Mock Data Creates

### Venues

- **The Pool Hall** (Austin, TX)
- **Billiards Central** (Dallas, TX)
- **Corner Pocket Bar** (Houston, TX)

### Tournaments (with different time periods)

- **Tournament 1001**: Daily 8-Ball Championship (created 12 hours ago)
- **Tournament 1002**: Weekly 9-Ball Tournament (created 5 days ago)
- **Tournament 1003**: Corner Pocket Classic (created 6 days ago)
- **Tournament 1004**: Monthly Masters (created 15 days ago)
- **Tournament 1005**: Billiards Bonanza (created 20 days ago)
- **Tournament 1006**: Annual Championship (created 45 days ago)

### Tournament Likes Distribution

- **Last 24 hours**: 5 likes (tournament 1001 only)
- **Last week**: 11 likes (tournaments 1001, 1002, 1003)
- **Last month**: 18 likes (tournaments 1001-1005)
- **Lifetime**: 23 likes (all tournaments 1001-1006)

### Mock Users

- 5 test users (Alex Player, Bob Shooter, Carol Cue, Dave Rack, Eve Break)

## How to Use

### Step 1: Insert Mock Data

Run the mock data script in your database:

```sql
-- Execute this file in your Supabase SQL editor or psql
\i sql/insert_mock_venue_performance_data.sql
```

### Step 2: Verify Data (Optional)

Run the test script to verify the data was inserted correctly:

```sql
-- Execute this file to see expected results
\i sql/test_venue_performance.sql
```

### Step 3: Test in the App

1. Open the Bar Owner Dashboard in your app
2. Navigate to the Venue Performance section
3. Test the time period dropdown with different options:
   - **Day**: Should show 5 likes
   - **Week**: Should show 11 likes
   - **Month**: Should show 18 likes
   - **Year/Lifetime**: Should show 23 likes

## Expected Results by Time Period

| Time Period   | Expected Likes | Tournaments Included         |
| ------------- | -------------- | ---------------------------- |
| Last 24 Hours | 5              | Tournament 1001 only         |
| Last Week     | 11             | Tournaments 1001, 1002, 1003 |
| Last Month    | 18             | Tournaments 1001-1005        |
| Lifetime      | 23             | All tournaments 1001-1006    |

## Testing the Dashboard

### What to Look For:

1. **Time Period Dropdown**: Should show options (Day, Week, Month, Year, Lifetime)
2. **Dynamic Updates**: Likes count should change when selecting different periods
3. **Venue Breakdown**: Each venue should show appropriate statistics
4. **Console Logs**: Check browser/app console for debugging information

### Troubleshooting:

- If no data appears, check that the mock data was inserted successfully
- Verify that your user has bar owner permissions and is associated with the test venues
- Check the browser console for any API errors
- Ensure the `GetVenueTournamentLikesStatsByPeriod` function is working correctly

## Cleanup (Optional)

To remove the mock data after testing:

```sql
-- Remove mock tournaments
DELETE FROM tournaments WHERE id_unique_number BETWEEN 1001 AND 1006;

-- Remove mock venues (optional - only if you want to clean up completely)
DELETE FROM venues WHERE venue IN ('The Pool Hall', 'Billiards Central', 'Corner Pocket Bar');

-- Remove mock users (optional)
DELETE FROM profiles WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005'
);
```

## Notes

- The mock data uses realistic timestamps relative to the current time
- All tournaments are set to 'approved' status to ensure they appear in the dashboard
- The data includes both `likes` table entries and `tournament_likes_history` entries for comprehensive testing
- Tournament views are also included to test the view statistics functionality
