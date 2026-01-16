# Pagination Code Reference

This document provides the requested information about the pagination implementation.

## 1) Arrow Rendering Block

**Location:** `CompeteApp/components/UI/Pagination/Pagiination.tsx` (lines 60-103)

```tsx
{
  __totalPages() > 1 ? (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
        },
      ]}
    >
      {/* LEFT ARROW */}
      <View
        style={[
          {
            width: 40,
          },
          __currentPage() === 1 ? { pointerEvents: 'none' } : null,
        ]}
      >
        <LFButton
          type={__currentPage() === 1 ? 'dark' : 'primary'}
          icon="chevron-back"
          size="small"
          onPress={() => {
            if (FLoadDataByOffset !== undefined) {
              const newOffset = offset - countPerPage;
              FLoadDataByOffset(newOffset >= 0 ? newOffset : 0);
            }
          }}
        />
      </View>

      {/* PAGE INDICATOR */}
      <Text
        style={[
          StyleZ.p,
          {
            marginInline: BasePaddingsMargins.m10,
          },
        ]}
      >
        Page {__currentPage()} / {__totalPages()}
      </Text>

      {/* RIGHT ARROW */}
      <View
        style={[
          { width: 40 },
          __currentPage() === __totalPages() ? { pointerEvents: 'none' } : null,
        ]}
      >
        <LFButton
          type={__currentPage() === __totalPages() ? 'dark' : 'primary'}
          icon="chevron-forward"
          size="small"
          onPress={() => {
            if (FLoadDataByOffset !== undefined) {
              const newOffset = offset + countPerPage;
              FLoadDataByOffset(newOffset < totalCount ? newOffset : offset);
            }
          }}
        />
      </View>
    </View>
  ) : null;
}
```

**Key Logic:**

- Left arrow: Calculates `newOffset = offset - countPerPage`, ensures it's >= 0
- Right arrow: Calculates `newOffset = offset + countPerPage`, ensures it's < totalCount
- Arrows are disabled (dark color + pointerEvents: 'none') when at first/last page

---

## 2) "Total count: … Displaying …" Text Block

**Location:** `CompeteApp/components/UI/Pagination/Pagiination.tsx` (lines 54-56)

```tsx
<Text style={StyleZ.p}>
  Total count: {totalCount} Displaying {__displayRange()}
</Text>
```

**Helper Function** (lines 29-42):

```tsx
const __displayRange = (): string => {
  // If there are no items at all, display "0-0"
  if (
    totalCount === 0 ||
    (currentItemsCount !== undefined && currentItemsCount === 0)
  ) {
    return '0-0';
  }

  const start = offset + 1;
  const end = currentItemsCount
    ? offset + currentItemsCount
    : Math.min(offset + countPerPage, totalCount);
  return `${start}-${end}`;
};
```

**Logic:**

- If no items: returns "0-0"
- Otherwise: calculates start as `offset + 1` (1-indexed)
- End is either `offset + currentItemsCount` (actual items on page) or `offset + countPerPage` (whichever is smaller)

---

## 3) Fetch Call + State Updates

**Location:** `CompeteApp/screens/Billiard/ScreenBilliardHome.tsx`

### State Declarations (lines ~50-52):

```tsx
const [offsetTournaments, set_offsetTournaments] = useState<number>(0);
const [totalCount, set_totalCount] = useState<number>(0);
const [tournaments, set_tournaments] = useState<ITournament[]>([]);
```

### Fetch Function (lines ~150-250):

```tsx
const __LoadTheTournaments = async (offset?: number) => {
  console.log('=== LoadTournaments STARTED ===');

  try {
    // ... filter preparation code ...

    // FETCH CALL
    const {
      tournaments: fetchedTournaments,
      totalCount: calculatedTotalCount,
    } = await FetchTournaments({
      offset: offset !== undefined ? offset : 0,
      limit: COUNT_TOURNAMENTS_IN_PAGE,
      // ... other filter parameters ...
    });

    // STATE UPDATES
    if (fetchedTournaments && fetchedTournaments.length > 0) {
      set_tournaments(fetchedTournaments);
      set_offsetTournaments(offset !== undefined ? offset : 0);
      set_totalCount(calculatedTotalCount);
    } else {
      set_tournaments([]);
      set_offsetTournaments(offset !== undefined ? offset : 0);
      set_totalCount(0);
    }
  } catch (error) {
    console.error('Error loading tournaments:', error);
  }
};
```

**Key Points:**

- Function accepts optional `offset` parameter
- Calls `FetchTournaments` from `CrudTournament.tsx` with offset and limit
- Updates three state variables:
  1. `set_tournaments()` - the tournament list
  2. `set_offsetTournaments()` - current offset
  3. `set_totalCount()` - total count from database

### Usage in Component:

```tsx
// Passed to ScreenBilliardListTournaments
<ScreenBilliardListTournaments
  tournaments={tournaments}
  offsetTournaments={offsetTournaments}
  totalCount={totalCount}
  __LoadTheTournaments={__LoadTheTournaments}
  // ... other props ...
/>
```

---

## 4) Constants Used for Paging

**Location:** `CompeteApp/hooks/constants.tsx`

```tsx
export const COUNT_TOURNAMENTS_IN_PAGE: number = 20;
```

**Usage:**

- This constant defines how many tournaments are displayed per page
- Used in:
  - Pagination component as `countPerPage` prop
  - Fetch function as `limit` parameter
  - Calculating total pages: `Math.ceil(totalCount / countPerPage)`

---

## Data Flow Summary

```
User clicks arrow
    ↓
Pagination component calculates new offset
    ↓
Calls FLoadDataByOffset(newOffset)
    ↓
__LoadTheTournaments(newOffset) in ScreenBilliardHome
    ↓
FetchTournaments({ offset: newOffset, limit: 20, ... })
    ↓
Database query with LIMIT 20 OFFSET newOffset
    ↓
Returns { tournaments: [...], totalCount: X }
    ↓
State updates:
  - set_tournaments(fetchedTournaments)
  - set_offsetTournaments(newOffset)
  - set_totalCount(calculatedTotalCount)
    ↓
Component re-renders with new data
    ↓
Pagination shows updated page numbers and range
```

---

## Related Files

- **Pagination Component:** `CompeteApp/components/UI/Pagination/Pagiination.tsx`
- **List Component:** `CompeteApp/screens/Billiard/ScreenBilliardListTournaments.tsx`
- **Home Screen:** `CompeteApp/screens/Billiard/ScreenBilliardHome.tsx`
- **API Layer:** `CompeteApp/ApiSupabase/CrudTournament.tsx`
- **Constants:** `CompeteApp/hooks/constants.tsx`
