# BUILD 198: Simplify Count Structure - Implementation Plan

## Problem

Current structure `dataTotalCount = [{ totalcount: X }]` is fragile and prone to key mismatches. Tournaments display but count shows 0.

## Root Cause

Likely one of these:

1. **Key mismatch:** Reading `totalcount` but Postgres returns `totalCount` or `total_count`
2. **Stale data:** Different code paths return different structures
3. **RLS blocking count:** Count query blocked by different RLS policy
4. **UI reading wrong variable:** Display uses wrong source

## Solution: Simplify Everything

### 1. Change API Return Structure

**BEFORE:**

```typescript
return {
  data: ITournament[] | null,
  error: any,
  dataTotalCount: { totalcount: number }[] | null
}
```

**AFTER:**

```typescript
return {
  tournaments: ITournament[],
  totalCount: number,
  error: any
}
```

### 2. Use Supabase Built-in Count

**BEFORE:** Separate count query

```typescript
const { count } = await supabase.from('tournaments').select('id', { count: 'exact' })...
```

**AFTER:** Count from SAME query

```typescript
const { data, count, error } = await query.select('*', { count: 'exact' })...
```

This ensures count uses EXACT same filters as data.

### 3. Update ScreenBilliardHome

**BEFORE:**

```typescript
const { data, error, dataTotalCount } = await FetchTournaments_Filters(...)
const calculatedTotalCount = dataTotalCount[0]?.totalcount ?? 0
set_totalCount(calculatedTotalCount)
```

**AFTER:**

```typescript
const { tournaments, totalCount, error } = await FetchTournaments_Filters(...)
set_totalCount(totalCount ?? tournaments.length) // Fallback to length
set_tournaments(tournaments)
```

### 4. Fix UI Display

**BEFORE:**

```typescript
const __displayRange = (): string => {
  if (totalCount === 0 || currentItemsCount === 0) return '0-0';
  const start = offset + 1;
  const end = offset + currentItemsCount;
  return `${start}-${end}`;
};
```

**AFTER:**

```typescript
const __displayRange = (): string => {
  if (currentItemsCount === 0) return '0-0' // Only check actual items
  const start = offset + 1
  const end = offset + currentItemsCount
  return `${start}-${end}`
}

// Display count
Total count: {totalCount ?? '—'} Displaying {__displayRange()}
```

## Files to Modify

1. **CrudTournament.tsx**

   - Change return type
   - Use `count` from same query
   - Return simple `totalCount` number

2. **ScreenBilliardHome.tsx**

   - Update destructuring
   - Use `totalCount` directly
   - Fallback to `tournaments.length`

3. **Pagination.tsx**

   - Handle null totalCount gracefully
   - Always show correct "Displaying X-Y" from actual data

4. **app.json**
   - Update to BUILD 198

## Benefits

✅ No key mismatch possible (simple number)
✅ Count from SAME query (guaranteed parity)
✅ UI never shows "0-0" when items exist
✅ Fallback to length if count fails
✅ Much simpler, less fragile code
