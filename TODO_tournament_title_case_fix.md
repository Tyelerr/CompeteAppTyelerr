# Tournament Title Case Fix

## Task: Update tournament names to use proper title case formatting

### Files to Update:

- [x] CompeteApp/screens/Billiard/ScreenBilliardThumbDetails.tsx - Apply toTitleCase() to tournament name
- [x] CompeteApp/screens/Billiard/ScreenBilliardModalTournament.tsx - Apply toTitleCase() to tournament name

### Changes Made:

1. ScreenBilliardThumbDetails.tsx: Updated line 108 to use `toTitleCase(tournament.tournament_name)` instead of `tournament.tournament_name`
2. ScreenBilliardModalTournament.tsx: Updated line 193 to use `toTitleCase(tournament.tournament_name)` instead of `tournament.tournament_name`

### Status: ✅ COMPLETE

Both tournament cards and tournament detail modal now display tournament names with proper title case formatting (each word starts with a capital letter).
