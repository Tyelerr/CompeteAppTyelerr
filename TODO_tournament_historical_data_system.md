# Tournament Historical Data & Recurring Management System

## Overview

Implement a system to:

1. Store deleted tournaments for historical data
2. Automatically hide tournaments from display the day after their date passes (e.g., tournament on 7/13 gets hidden on 7/14)
3. Ensure recurring tournaments always have at least 4 available instances

## Implementation Plan

### Phase 1: Database Schema Updates

- [x] Create tournaments_history table for storing archived tournaments
- [x] Add new tournament status for expired tournaments
- [x] Create indexes for performance optimization

### Phase 2: Tournament Archival System

- [x] Create function to archive expired tournaments (day after tournament date)
- [x] Update tournament deletion to use soft delete with historical storage
- [x] Create function to check and archive tournaments daily

### Phase 3: Recurring Tournament Management

- [x] Create function to generate new recurring tournament instances
- [x] Ensure at least 4 future tournaments are always available for recurring series
- [x] Update recurring tournament creation logic

### Phase 4: Frontend Updates

- [x] Update FetchTournaments_Filters to exclude past-date tournaments
- [x] Add date-based filtering logic
- [x] Update tournament display components

### Phase 5: Maintenance Functions

- [x] Create daily maintenance function for tournament archival
- [x] Create recurring tournament generation function
- [x] Add logging and error handling

## Files to be Modified

- [x] `CompeteApp/sql/create_tournaments_history_table.sql` - New history table
- [x] `CompeteApp/sql/tournament_maintenance_functions.sql` - Maintenance functions
- [x] `CompeteApp/ApiSupabase/CrudTournament.tsx` - Updated CRUD operations
- [x] `CompeteApp/ApiSupabase/TournamentMaintenance.tsx` - New maintenance API
- [x] `CompeteApp/test_tournament_maintenance.js` - Test script for verification

## Success Criteria

- [x] Tournaments automatically disappear from billiards page the day after their date
- [x] Deleted tournaments are stored in history table for data retention
- [x] Recurring tournaments always show at least 4 future instances
- [x] System can be run daily to maintain tournament data
- [x] No data loss during archival process

## Current Status

- [x] Phase 1: Database Schema Updates - COMPLETE
- [x] Phase 2: Tournament Archival System - COMPLETE
- [x] Phase 3: Recurring Tournament Management - COMPLETE
- [x] Phase 4: Frontend Updates - COMPLETE
- [x] Phase 5: Maintenance Functions - COMPLETE

## Notes

- Tournament on 7/13 should be archived/hidden on 7/14
- Recurring tournaments should automatically generate new instances
- Historical data must be preserved for reporting/analytics
- System should be robust and handle edge cases
