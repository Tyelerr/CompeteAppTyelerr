# BUILD 190: Filter Parity Issue - Root Cause Found

## Problem

Tournaments appearing on wrong pages because **count query is missing filters** that the data query has.

---

## Missing Filters in Database-Only Count Query

The database-only count query (used when NO radius/daysOfWeek filtering) is **MISSING these filters**:

### ❌ MISSING: Entry Fee Range Filters

**Data Query HAS:**

```typescript
if (
  sanitizedFilters.entryFeeFrom !== undefined &&
  sanitizedFilters.entryFeeFrom !== null
) {
  query = query.gte('tournament_fee', sanitizedFilters.entryFeeFrom);
}
if (
  sanitizedFilters.entryFeeTo !== undefined &&
  sanitizedFilters.entryFeeTo !== null
) {
  query = query.lte('tournament_fee', sanitizedFilters.entryFeeTo);
}
```

**Count Query MISSING:** ❌ No entry fee filters at all

### ❌ MISSING: Fargo Rating Range Filters

**Data Query HAS:**

```typescript
if (
  sanitizedFilters.fargoRatingFrom !== undefined &&
  sanitizedFilters.fargoRatingFrom !== null
) {
  query = query.gte('max_fargo', sanitizedFilters.fargoRatingFrom);
}
if (
  sanitizedFilters.fargoRatingTo !== undefined &&
  sanitizedFilters.fargoRatingTo !== null
) {
  query = query.lte('max_fargo', sanitizedFilters.fargoRatingTo);
}
```

**Count Query MISSING:** ❌ No fargo rating filters at all

### ❌ MISSING: Boolean Filters

**Data Query HAS:**

```typescript
if (sanitizedFilters.reports_to_fargo !== undefined) {
  query = query.eq('reports_to_fargo', sanitizedFilters.reports_to_fargo);
}
if (sanitizedFilters.is_open_tournament !== undefined) {
  query = query.eq('is_open_tournament', sanitizedFilters.is_open_tournament);
}
if (sanitizedFilters.minimun_required_fargo_games_10plus === true) {
  query = query.gte('required_fargo_games', 10);
}
```

**Count Query MISSING:** ❌ No boolean filters at all

### ❌ MISSING: Date Range Filters

**Data Query HAS:**

```typescript
if (sanitizedFilters.dateFrom && sanitizedFilters.dateFrom !== '') {
  query = query.gte('start_date', sanitizedFilters.dateFrom);
}
if (sanitizedFilters.dateTo && sanitizedFilters.dateTo !== '') {
  query = query.lte('start_date', sanitizedFilters.dateTo);
}
```

**Count Query MISSING:** ❌ No date range filters (only has default "today onwards" for non-admin)

---

## Impact Example

**User applies filters:**

- Entry fee: $10-$50
- Fargo rating: 400-600
- Reports to Fargo: Yes

**What happens:**

1. **Data query** applies all filters → returns 15 tournaments
2. **Count query** ignores those filters → counts 28 tournaments
3. **Result:** totalCount = 28, but only 15 tournaments exist
4. **Pagination shows:** "Page 1 / 2" but page 2 is empty
5. **Items shift** because count doesn't match filtered data

---

## Solution

Add ALL missing filters to the database-only count query to ensure 100% parity with data query.

The count query must have:

1. ✅ Entry fee range filters
2. ✅ Fargo rating range filters
3. ✅ Boolean filters (reports_to_fargo, is_open_tournament, required_fargo_games)
4. ✅ Date range filters (dateFrom, dateTo)

---

## Files to Fix

- `CompeteApp/ApiSupabase/CrudTournament.tsx` - Add missing filters to database-only count query (around line 750-800)
