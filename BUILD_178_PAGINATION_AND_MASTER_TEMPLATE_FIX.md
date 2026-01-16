# BUILD 178 - Tournament Pagination & Master Template Exclusion FIX

## Issue

After BUILD 176 (recurring tournaments), the billiards page shows "Total count: 20 Displaying 1-20" with no pagination arrows, even though there are 27 displayable tournaments in the database.

## Root Cause (CONFIRMED via SQL Diagnostic)

Database has 30 tournaments:

- **3 master templates** (IDs: 21, 13, 36) with `is_recurring_master = true` - Should be HIDDEN
- **27 real tournaments** with `is_recurring_master = false` - Should be DISPLAYED

Master templates are blueprints for generating recurring tournaments and should NEVER be shown to users.

## Fix Applied

### Changed Filter Syntax in `CrudTournament.tsx`

**FROM (BUILD 177 - didn't work):**

```typescript
query = query.or('is_recurring_master.is.null,is_recurring_master.eq.false');
```

**TO (BUILD 178 - using .not() filter):**

```typescript
query = query.not('is_recurring_master', 'eq', true);
```

This simpler syntax is more reliable with Supabase and explicitly excludes tournaments where `is_recurring_master = true`.

### Applied to ALL Queries:

1. Main tournament query (line ~467)
2. Client-side filtering count query (line ~700)
3. Database-only filtering count query (line ~1050)

## Expected Result After Deployment

**Current:** "Total count: 20 Displaying 1-20" (no arrows)

**After BUILD 178:** "Total count: 27 Displaying 1-20" (with ← → arrows)

**Pagination:**

- Page 1: Tournaments 1-20
- Page 2: Tournaments 21-27

## Files Modified

- `CompeteApp/ApiSupabase/CrudTournament.tsx` - Changed filter syntax
- `CompeteApp/app.json` - Build 177 → 178

## Build Information

- **Build Number**: 178
- **Previous Build**: 177 (used `.or()` syntax - didn't work)
- **Fix**: Changed to `.not()` syntax for better Supabase compatibility
- **Related**: BUILD 176 (Recurring Tournament Template Status)
