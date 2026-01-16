# Favorites Count Fix for Bar Owner Dashboard

## Problem

The favorites count in the Bar Owner Dashboard is not updating correctly because there's a mismatch between:

1. The database function `get_venue_tournament_likes_stats_by_period` which returns JSON with **camelCase** keys
2. The TypeScript parsing code which expects **snake_case** keys

## Root Cause

In `CompeteApp/ApiSupabase/CrudTournament.tsx`, the `GetVenueTournamentLikesStatsByPeriod` function tries to parse:

```typescript
stats = {
  currentActiveLikes: parseInt(data.current_active_likes) || 0, // ❌ Wrong key
  totalHistoricalLikes: parseInt(data.total_historical_likes) || 0, // ❌ Wrong key
  periodLikes: parseInt(data.period_likes) || 0, // ❌ Wrong key
  uniqueUsersWhoLiked: parseInt(data.unique_users_who_liked) || 0, // ❌ Wrong key
};
```

But the SQL function returns:

```sql
json_build_object(
    'currentActiveLikes', current_active_likes,  // ✅ camelCase
    'totalHistoricalLikes', total_historical_likes,  // ✅ camelCase
    'periodLikes', period_likes,  // ✅ camelCase
    'uniqueUsersWhoLiked', unique_users_who_liked  // ✅ camelCase
)
```

## Solution

Update the TypeScript parsing code to use the correct camelCase property names that match what the database function returns.

## Files to Fix

1. `CompeteApp/ApiSupabase/CrudTournament.tsx` - Update the `GetVenueTournamentLikesStatsByPeriod` function

## Implementation

See the fixed version in `CompeteApp/ApiSupabase/CrudTournament_FavoritesFixed.tsx`
