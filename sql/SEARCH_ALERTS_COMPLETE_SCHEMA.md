# Search Alerts Table - Complete Schema & Matching Rules

## Table: public.search_alerts

### Complete Column List (21 columns total)

#### Identity & Control

1. `id` - UUID PRIMARY KEY (auto-generated)
2. `user_id` - UUID FK → auth.users.id (NOT NULL, CASCADE DELETE)
3. `alert_name` - TEXT (user-friendly name)
4. `is_enabled` - BOOLEAN (DEFAULT true)

#### Tournament Filter Columns (all nullable)

5. `game_type` - TEXT
6. `format` - TEXT
7. `equipment` - TEXT
8. `reports_to_fargo` - BOOLEAN
9. `table_size` - TEXT
10. `is_open_tournament` - BOOLEAN

#### Fargo & Entry Fee Filters

11. `max_entry_fee` - NUMERIC (cap: match if tournaments.tournament_fee ≤ this)
12. `min_fargo` - INTEGER (floor: match if tournaments.max_fargo ≥ this)
13. `max_fargo` - INTEGER (cap: match if tournaments.max_fargo ≤ this)
14. `required_fargo_games` - INTEGER (match if tournaments.required_fargo_games ≥ this)

#### Location Filters

15. `city` - TEXT (parsed city)
16. `state` - TEXT (parsed state)
17. `location_text` - TEXT (free-text search via ILIKE on tournaments.address OR tournaments.venue)

#### Date Range Filters

18. `date_from` - DATE (match if tournaments.start_date ≥ this)
19. `date_to` - DATE (match if tournaments.start_date ≤ this)

#### Timestamps

20. `created_at` - TIMESTAMPTZ (DEFAULT NOW())
21. `updated_at` - TIMESTAMPTZ (DEFAULT NOW(), auto-updated via trigger)

---

## Matching Rules (Pseudo-SQL Logic)

```sql
-- A tournament matches an alert if ALL non-null alert filters pass

WHERE
  -- Exact match filters
  (alert.game_type IS NULL OR tournament.game_type = alert.game_type)
  AND (alert.format IS NULL OR tournament.format = alert.format)
  AND (alert.equipment IS NULL OR tournament.equipment = alert.equipment)
  AND (alert.reports_to_fargo IS NULL OR tournament.reports_to_fargo = alert.reports_to_fargo)
  AND (alert.table_size IS NULL OR tournament.table_size = alert.table_size)
  AND (alert.is_open_tournament IS NULL OR tournament.is_open_tournament = alert.is_open_tournament)

  -- Cap filters (tournament value must be <= alert value)
  AND (alert.max_entry_fee IS NULL OR tournament.tournament_fee <= alert.max_entry_fee)
  AND (alert.max_fargo IS NULL OR tournament.max_fargo <= alert.max_fargo)

  -- Floor filter (tournament value must be >= alert value)
  AND (alert.min_fargo IS NULL OR tournament.max_fargo >= alert.min_fargo)

  -- Required games filter
  AND (alert.required_fargo_games IS NULL OR tournament.required_fargo_games >= alert.required_fargo_games)

  -- Location filters
  AND (alert.city IS NULL OR tournament.city = alert.city)
  AND (alert.state IS NULL OR tournament.state = alert.state)
  AND (alert.location_text IS NULL OR
       tournament.address ILIKE '%' || alert.location_text || '%' OR
       tournament.venue ILIKE '%' || alert.location_text || '%')

  -- Date range filters
  AND (alert.date_from IS NULL OR tournament.start_date >= alert.date_from)
  AND (alert.date_to IS NULL OR tournament.start_date <= alert.date_to)

  -- Only active alerts
  AND alert.is_enabled = true
```

---

## Field Mapping: Modal ↔ Database

| Modal Field              | Database Column        | Type    | Matching Logic                          |
| ------------------------ | ---------------------- | ------- | --------------------------------------- |
| Alert Name               | `alert_name`           | TEXT    | N/A (display only)                      |
| Game Type                | `game_type`            | TEXT    | Exact match                             |
| Format                   | `format`               | TEXT    | Exact match                             |
| Equipment                | `equipment`            | TEXT    | Exact match                             |
| Reports to Fargo         | `reports_to_fargo`     | BOOLEAN | Exact match                             |
| Max Entry Fee            | `max_entry_fee`        | NUMERIC | tournaments.tournament_fee ≤ this       |
| Min Fargo                | `min_fargo`            | INTEGER | tournaments.max_fargo ≥ this            |
| Max Fargo                | `max_fargo`            | INTEGER | tournaments.max_fargo ≤ this            |
| Required Fargo Games     | `required_fargo_games` | INTEGER | tournaments.required_fargo_games ≥ this |
| Table Size               | `table_size`           | TEXT    | Exact match                             |
| Open Tournament          | `is_open_tournament`   | BOOLEAN | Exact match                             |
| City                     | `city`                 | TEXT    | Exact match                             |
| State                    | `state`                | TEXT    | Exact match                             |
| Location (City OR Venue) | `location_text`        | TEXT    | ILIKE on address OR venue               |
| Date From                | `date_from`            | DATE    | tournaments.start_date ≥ this           |
| Date To                  | `date_to`              | DATE    | tournaments.start_date ≤ this           |

---

## RLS Policies (Strict User Isolation)

```sql
-- SELECT: auth.uid() = user_id
-- INSERT: auth.uid() = user_id
-- UPDATE: auth.uid() = user_id
-- DELETE: auth.uid() = user_id
-- NO ADMIN OVERRIDE
```

---

## Indexes

1. `idx_search_alerts_user_id` ON (user_id)
2. `idx_search_alerts_is_enabled` ON (is_enabled)
3. `idx_search_alerts_user_enabled` ON (user_id, is_enabled)
4. `idx_search_alerts_created_at` ON (created_at DESC)

---

## Key Implementation Notes

### 1. Null Handling

**Null = Ignore Filter**. Only non-null columns restrict matching.

### 2. Fargo Range Logic

- `min_fargo` = 500 → match tournaments with max_fargo ≥ 500
- `max_fargo` = 700 → match tournaments with max_fargo ≤ 700
- Both set → match tournaments with 500 ≤ max_fargo ≤ 700

### 3. Location Flexibility

- `city` + `state` = precise geographic matching
- `location_text` = flexible search (e.g., "Downtown" matches any address/venue containing "Downtown")
- Can use both simultaneously

### 4. Date Range

- `date_from` only → all tournaments from this date forward
- `date_to` only → all tournaments up to this date
- Both → tournaments within the range

### 5. Entry Fee vs Tournament Fee

- Alert column: `max_entry_fee`
- Tournament column: `tournament_fee`
- Match if: `tournament.tournament_fee ≤ alert.max_entry_fee`

---

## Example Alert

```typescript
{
  user_id: "user-uuid-here",
  alert_name: "Vegas 9-Ball Under $50",
  game_type: "9-Ball",
  city: "Las Vegas",
  state: "NV",
  max_entry_fee: 50,
  min_fargo: 400,
  max_fargo: 700,
  is_open_tournament: true,
  is_enabled: true
}
```

This alert matches:

- ✅ 9-Ball tournaments
- ✅ In Las Vegas, NV
- ✅ Entry fee ≤ $50
- ✅ Fargo rating between 400-700
- ✅ Open tournaments only

---

**Total Columns:** 21 exactly

1. id, 2. user_id, 3. alert_name, 4. game_type, 5. format, 6. equipment, 7. reports_to_fargo, 8. max_entry_fee, 9. min_fargo, 10. max_fargo, 11. required_fargo_games, 12. table_size, 13. is_open_tournament, 14. city, 15. state, 16. location_text, 17. date_from, 18. date_to, 19. is_enabled, 20. created_at, 21. updated_at

**Nullable Filters:** 16 (all except id, user_id, is_enabled, created_at, updated_at)
**RLS:** Strict user isolation, no admin bypass

**Note on required_fargo_games:**

- Column exists in search_alerts for UI/storage
- Matching logic: IF tournaments.required_fargo_games column exists, match where tournaments.required_fargo_games ≥ alert.required_fargo_games
- If tournaments table does NOT have this column yet, this filter is ignored in matching (but still stored in alerts)
