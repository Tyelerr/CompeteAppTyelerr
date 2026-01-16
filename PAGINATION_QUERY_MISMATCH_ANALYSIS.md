# Pagination Query Mismatch Analysis

## Problem Statement

Tournaments appearing on wrong pages indicates that:

1. **Data query** returns one set of tournaments
2. **Count query** counts a different set of tournaments
3. This causes page calculations to be wrong

## Example of the Problem

**Scenario:**

- Database has 28 tournaments total
- Data query filters to 22 tournaments (excludes 6 masters)
- Count query counts 28 tournaments (includes masters)

**Result:**

- totalCount = 28
- Expected pages = 28 / 20 = 2 pages
- But data query only has 22 tournaments
- Page 2 shows tournaments 21-22 (only 2 items)
- **Items shift between pages** because count is wrong

## Root Cause in Current Code

The issue is in `FetchTournaments_Filters` in CrudTournament.tsx:

### Path 1: Database-Only Filtering (state/city)

```typescript
// DATA QUERY
let query = supabase.from('tournaments').select(...)
  .not('is_recurring_master', 'eq', true)  // ✅ Excludes masters
  .eq('status', 'active')                   // ✅ Only active
  .gte('start_date', today)                 // ✅ Future only

// COUNT QUERY
let countQuery = supabase.from('tournaments')
  .select('tournaments.id', { count: 'exact' })
  .not('is_recurring_master', 'eq', true)  // ✅ Excludes masters

if (!isAdmin) {
  countQuery = countQuery.eq('status', 'active')      // ✅ Only active
  if (!sanitizedFilters.dateFrom) {
    countQuery = countQuery.gte('start_date', today)  // ✅ Future only
  }
}
```

**Status:** ✅ These should match now after BUILD 180 fixes

### Path 2: Client-Side Filtering (radius/daysOfWeek)

```typescript
// DATA QUERY
let countDataQuery = supabase.from('tournaments').select(...)
  .not('is_recurring_master', 'eq', true)  // ✅ Excludes masters
  .eq('status', 'active')                   // ✅ Only active
  .gte('start_date', today)                 // ✅ Future only

// Then client-side filters by radius and daysOfWeek
// Final count = filtered array length

// COUNT QUERY
let countQuery = supabase.from('tournaments')
  .select('tournaments.id', { count: 'exact' })
  .not('is_recurring_master', 'eq', true)  // ✅ Excludes masters

const isAdminForClientCount = sanitizedFilters.userRole === 'admin';
if (!isAdminForClientCount) {
  countQuery = countQuery.eq('status', 'active')      // ✅ Only active
  if (!sanitizedFilters.dateFrom) {
    countQuery = countQuery.gte('start_date', today)  // ✅ Future only
  }
}
```

**Status:** ✅ These should match now after BUILD 180 fixes

## Potential Remaining Issues

### 1. Order By Mismatch

If data query and count query use different ORDER BY, the same filters could return different results.

**Check:** Do both queries use the same ORDER BY?

### 2. Client-Side Filtering Inconsistency

The client-side path:

1. Fetches ALL matching tournaments (no LIMIT)
2. Filters by radius/daysOfWeek in JavaScript
3. Slices to get current page
4. Count = filtered array length

**Problem:** If the initial fetch has a different filter than the count query, the counts won't match.

### 3. Missing Filters in Count Query

Some filters might be applied to data query but not count query:

- game_type
- format
- table_size
- equipment
- entry fee ranges
- fargo rating ranges
- etc.

## Solution: Ensure 100% Filter Parity

**The count query MUST have EXACTLY the same filters as the data query**, except:

- No SELECT of full columns (just count)
- No LIMIT/OFFSET
- No ORDER BY (doesn't affect count)

Every `.eq()`, `.gte()`, `.lte()`, `.in()`, `.not()`, `.ilike()` must be identical.

## Next Steps

1. Read the full CrudTournament.tsx file
2. Compare data query filters vs count query filters line-by-line
3. Identify any missing filters in count query
4. Add those filters to ensure 100% parity
5. Test with logging to confirm counts match
