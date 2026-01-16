# Tournament Historical Data & Recurring Management System - Implementation Guide

## Overview

This system implements automatic tournament archival and recurring tournament management to ensure:

1. **Tournaments automatically disappear from the billiards page the day after their date**
2. **Deleted tournaments are stored for historical data**
3. **Recurring tournaments always have at least 4 available instances**

## 🚀 Quick Start

### Step 1: Database Setup

Run these SQL files in your Supabase database in order:

```sql
-- 1. Create the tournaments history table
-- File: CompeteApp/sql/create_tournaments_history_table.sql
```

```sql
-- 2. Create the maintenance functions
-- File: CompeteApp/sql/tournament_maintenance_functions.sql
```

### Step 2: Test the System

```bash
# Update the credentials in the test file first
node CompeteApp/test_tournament_maintenance.js
```

### Step 3: Set Up Daily Maintenance

Choose one of these options:

#### Option A: Supabase Cron (Recommended)

```sql
-- Add to your Supabase database
SELECT cron.schedule(
  'tournament-maintenance',
  '0 2 * * *', -- Run at 2 AM daily
  'SELECT archive_expired_tournaments();'
);
```

#### Option B: External Cron Job

```bash
# Add to your server's crontab
0 2 * * * curl -X POST "https://your-api.com/tournament-maintenance"
```

#### Option C: Manual API Call

```javascript
import { runTournamentMaintenance } from './ApiSupabase/TournamentMaintenance';

// Call this daily
const result = await runTournamentMaintenance();
console.log('Maintenance result:', result);
```

## 📋 System Components

### 1. Database Schema

#### tournaments_history Table

- Stores all archived tournaments with full historical data
- Includes archival metadata (reason, timestamp, user)
- Preserves creator and venue information as snapshots

#### Key Fields:

- `original_id`: Reference to original tournament
- `archived_at`: When tournament was archived
- `archived_reason`: 'expired', 'deleted', or 'manual'
- `creator_profile_id`: Snapshot of tournament creator
- `venue_snapshot`: JSON snapshot of venue data

### 2. Maintenance Functions

#### `archive_expired_tournaments()`

- Archives tournaments past their date
- Generates new recurring tournament instances
- Returns count of archived and generated tournaments

#### `generate_recurring_tournaments()`

- Ensures each recurring series has at least 4 future tournaments
- Creates new instances based on master tournament template

#### `archive_tournament_manual()`

- Manually archives a tournament (for deletions)
- Tracks which user triggered the archival

#### `get_tournament_archival_stats()`

- Returns statistics about archived tournaments
- Useful for monitoring and reporting

### 3. API Layer

#### TournamentMaintenance.tsx

- `runTournamentMaintenance()`: Main maintenance function
- `archiveTournamentManual()`: Manual archival
- `getTournamentArchivalStats()`: Get statistics
- `checkMaintenanceNeeded()`: Check if maintenance is required

### 4. Frontend Updates

#### CrudTournament.tsx Changes

- **Date Filtering**: Only shows tournaments from today onwards
- **Soft Delete**: `DeleteTournament()` now archives instead of deleting
- **Count Queries**: Updated to respect date filtering

## 🔧 How It Works

### Automatic Tournament Hiding

```javascript
// In FetchTournaments_Filters()
const today = new Date().toISOString().split('T')[0];
query = query.gte('start_date', today);
```

This ensures tournaments automatically disappear the day after their date.

### Tournament Archival Process

1. **Daily Check**: System identifies tournaments with `start_date < today`
2. **Data Preservation**: Full tournament data copied to `tournaments_history`
3. **Metadata Addition**: Archival reason, timestamp, and user tracking
4. **Cleanup**: Original tournament removed from active table

### Recurring Tournament Management

1. **Series Monitoring**: Checks each recurring series for future tournaments
2. **Gap Detection**: Identifies series with fewer than 4 future tournaments
3. **Instance Generation**: Creates new tournaments based on master template
4. **Date Calculation**: Adds weekly intervals to maintain schedule

## 📊 Monitoring & Statistics

### Check System Status

```javascript
import { getTournamentArchivalStats } from './ApiSupabase/TournamentMaintenance';

const { stats } = await getTournamentArchivalStats();
console.log('Total archived:', stats.totalArchived);
console.log('Active tournaments:', stats.activeTournaments);
console.log('Recurring series:', stats.recurringSeriesCount);
```

### View Archived Tournaments

```javascript
import { getArchivedTournaments } from './ApiSupabase/TournamentMaintenance';

const { tournaments } = await getArchivedTournaments(0, 20, 'expired');
// Returns paginated list of archived tournaments
```

## 🛠️ Maintenance Commands

### Manual Maintenance Run

```javascript
import { runTournamentMaintenance } from './ApiSupabase/TournamentMaintenance';

const result = await runTournamentMaintenance();
console.log(`Archived: ${result.archivedCount}`);
console.log(`Generated: ${result.recurringGeneratedCount}`);
```

### Check if Maintenance is Needed

```javascript
import { checkMaintenanceNeeded } from './ApiSupabase/TournamentMaintenance';

const check = await checkMaintenanceNeeded();
if (check.maintenanceNeeded) {
  console.log(`${check.expiredTournamentsCount} tournaments need archiving`);
  console.log(
    `${check.recurringSeriesNeedingTournaments} series need tournaments`,
  );
}
```

### Manual Tournament Deletion

```javascript
import { DeleteTournament } from './ApiSupabase/CrudTournament';

// This now archives instead of permanently deleting
const result = await DeleteTournament(tournamentId, userId, 'deleted');
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Functions Not Found

**Error**: `function archive_expired_tournaments() does not exist`
**Solution**: Run the SQL files in your database:

```sql
-- Run these files in order:
-- 1. CompeteApp/sql/create_tournaments_history_table.sql
-- 2. CompeteApp/sql/tournament_maintenance_functions.sql
```

#### 2. Permission Errors

**Error**: `permission denied for function`
**Solution**: Ensure your database user has execute permissions:

```sql
GRANT EXECUTE ON FUNCTION archive_expired_tournaments() TO your_user;
GRANT EXECUTE ON FUNCTION generate_recurring_tournaments() TO your_user;
```

#### 3. No Tournaments Being Archived

**Check**: Verify tournaments exist with past dates:

```sql
SELECT tournament_name, start_date
FROM tournaments
WHERE start_date < CURRENT_DATE AND status = 'active';
```

#### 4. Recurring Tournaments Not Generating

**Check**: Verify recurring series exist:

```sql
SELECT recurring_series_id, COUNT(*)
FROM tournaments
WHERE recurring_series_id IS NOT NULL
  AND start_date >= CURRENT_DATE
GROUP BY recurring_series_id;
```

### Debug Mode

Enable detailed logging by setting environment variable:

```bash
DEBUG_TOURNAMENT_MAINTENANCE=true
```

## 📈 Performance Considerations

### Database Indexes

The system creates these indexes automatically:

- `idx_tournaments_history_original_id`
- `idx_tournaments_history_archived_at`
- `idx_tournaments_history_archived_reason`
- `idx_tournaments_recurring_series_id`

### Batch Processing

- Maintenance processes tournaments in batches
- Large datasets are handled efficiently
- Memory usage is optimized for production

### Monitoring Queries

```sql
-- Check system performance
SELECT
  COUNT(*) as total_active,
  COUNT(CASE WHEN start_date < CURRENT_DATE THEN 1 END) as expired,
  COUNT(CASE WHEN recurring_series_id IS NOT NULL THEN 1 END) as recurring
FROM tournaments
WHERE status = 'active';
```

## 🔐 Security Considerations

### Data Privacy

- Historical data preserves user information as snapshots
- Archived tournaments maintain referential integrity
- Personal data follows same privacy rules as active tournaments

### Access Control

- Maintenance functions require appropriate database permissions
- API endpoints should be secured with authentication
- Admin-only access for historical data viewing

## 📝 Maintenance Schedule

### Daily Tasks (Automated)

- Archive expired tournaments
- Generate new recurring tournament instances
- Update statistics

### Weekly Tasks (Manual)

- Review archival statistics
- Check for orphaned recurring series
- Verify system performance

### Monthly Tasks (Manual)

- Clean up old historical data (optional)
- Review and optimize database indexes
- Update maintenance schedules if needed

## 🎯 Success Metrics

The system is working correctly when:

- ✅ Tournaments disappear from billiards page day after their date
- ✅ Deleted tournaments appear in tournaments_history table
- ✅ Each recurring series maintains 4+ future tournaments
- ✅ No data loss during archival process
- ✅ System runs daily without errors

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Run the test script: `node CompeteApp/test_tournament_maintenance.js`
3. Review database logs for error messages
4. Verify all SQL functions are installed correctly

## 🔄 Future Enhancements

Potential improvements:

- Admin dashboard for historical tournament viewing
- Configurable archival retention periods
- Advanced recurring tournament patterns (monthly, custom intervals)
- Automated reporting and analytics
- Integration with external calendar systems
