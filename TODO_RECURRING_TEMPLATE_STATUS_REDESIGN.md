# TODO: Recurring Tournament Template Status Redesign

## Problem Identified

Current system has a critical flaw: if a master tournament gets archived (because its date passed), the system can't generate new recurring instances anymore.

## Proposed Solution: Separate Template Status from Instance Status

### 1. Add New Field: `recurring_template_status`

**Database Migration:**

```sql
-- Create enum type
CREATE TYPE recurring_template_status_enum AS ENUM ('active', 'paused', 'archived');

-- Add column to tournaments table
ALTER TABLE tournaments
ADD COLUMN recurring_template_status recurring_template_status_enum DEFAULT 'active';

-- Set existing recurring masters to 'active'
UPDATE tournaments
SET recurring_template_status = 'active'
WHERE is_recurring_master = true;
```

**Field Values:**

- `active` - Series should keep generating new instances
- `paused` - Temporarily stop generating (can be resumed)
- `archived` - Permanently stop generating

### 2. Update Generator Logic

**Current (Flawed):**

```sql
WHERE is_recurring_master = true
AND is_recurring = true
AND status = 'active'  -- ❌ PROBLEM: Master gets archived when date passes
```

**New (Correct):**

```sql
WHERE is_recurring_master = true
AND is_recurring = true
AND recurring_template_status = 'active'  -- ✅ Template status independent of instance status
```

**Key Insight:** Master tournament can have `status = 'archived'` (as an instance) while `recurring_template_status = 'active'` (as a template).

### 3. Update Archival Logic

**Archive Job Rules:**

- CAN set `status = 'archived'` for ANY past tournament (including masters)
- MUST NEVER change `recurring_template_status`
- Only admins/bar owners can change `recurring_template_status`

```sql
-- Archive past tournaments (including masters as instances)
UPDATE tournaments
SET status = 'archived'
WHERE start_date < CURRENT_DATE
AND status = 'active';
-- Note: Does NOT touch recurring_template_status

-- To stop a recurring series (admin action only):
UPDATE tournaments
SET recurring_template_status = 'archived'
WHERE id = <master_tournament_id>
AND is_recurring_master = true;
```

### 4. Update Generator to Use Series ID

**Current Problem:** Generator looks at master tournament's date
**Solution:** Generator should look at latest child instance by `recurring_series_id`

```sql
-- Find latest generated instance for each series
SELECT MAX(start_date) as latest_date
FROM tournaments
WHERE recurring_series_id = <series_id>
AND is_recurring_master = false;

-- If no children exist, use master's start_date as baseline
```

### 5. Prevent Duplicates

**Add Unique Constraint:**

```sql
CREATE UNIQUE INDEX idx_unique_recurring_instance
ON tournaments (recurring_series_id, start_date)
WHERE is_recurring = true;
```

### 6. Files to Update

**Database:**

- [ ] `sql/add_recurring_template_status_column.sql` - Add new field
- [ ] `sql/update_generator_use_template_status.sql` - Fix generator logic
- [ ] `sql/update_archival_preserve_template_status.sql` - Fix archival

**TypeScript:**

- [ ] `hooks/InterfacesGlobal.tsx` - Add `recurring_template_status` to ITournament interface
- [ ] `ApiSupabase/CrudTournament.tsx` - Handle new field in create/update
- [ ] `screens/Submit/ScreenSubmit.tsx` - Set default `recurring_template_status = 'active'` for new recurring tournaments

**Admin UI (Future):**

- [ ] Add ability to pause/archive recurring series
- [ ] Show template status in admin tournament management

### 7. Migration Strategy

**Step 1:** Add column with default 'active'
**Step 2:** Update existing masters to 'active'
**Step 3:** Update generator function
**Step 4:** Update archival function
**Step 5:** Update TypeScript interfaces
**Step 6:** Update tournament creation logic
**Step 7:** Test thoroughly

### 8. Benefits

✅ Master tournaments can be archived as instances while template stays active
✅ Admins can pause/resume recurring series without deleting
✅ Clear separation of concerns: instance status vs template status
✅ Generator works independently of master tournament dates
✅ No data loss when archiving past tournaments

## Current Status

**Build 174 Completed:**

- ✅ Timezone fix applied
- ✅ Temporary fix: Archival excludes masters (workaround)

**Next Steps:**
This redesign should be implemented as a separate task to properly architect the recurring tournament system with `recurring_template_status`.
