# Database Schema & Excel Import Guide

## Overview

Your CompeteApp uses **Supabase** (PostgreSQL) as the database. This guide provides all table column names and instructions for importing data from Excel sheets.

---

## Main Database Tables & Columns

### 1. **TOURNAMENTS** Table

Main table for storing tournament information.

**Column Names:**

- `id` (UUID, Primary Key, Auto-generated)
- `id_unique_number` (Integer, Unique identifier)
- `uuid` (UUID)
- `tournament_name` (Text)
- `game_type` (Text) - Values: '8-Ball', '9-Ball', '10-Ball', 'One Pocket', 'Straight Pool', 'Bank Pool'
- `format` (Text) - Values: 'Single Elimination', 'Double Elimination', 'Round Robin', 'Double Round Robin', 'Swiss System', 'Chip Tournament'
- `director_name` (Text)
- `description` (Text)
- `equipment` (Text)
- `custom_equipment` (Text)
- `game_spot` (Text)
- `venue` (Text) - Venue name
- `venue_lat` (Text) - Latitude (legacy)
- `venue_lng` (Text) - Longitude (legacy)
- `address` (Text)
- `phone` (Text)
- `city` (Text)
- `state` (Text)
- `zip_code` (Text)
- `thumbnail_type` (Text)
- `thumbnail_url` (Text)
- `start_date` (Date) - Format: YYYY-MM-DD
- `strart_time` (Time) - Format: HH:MM (Note: typo in column name)
- `is_recurring` (Boolean)
- `reports_to_fargo` (Boolean)
- `is_open_tournament` (Boolean)
- `race_details` (Text)
- `number_of_tables` (Integer)
- `table_size` (Text) - Values: '7ft', '8ft', '9ft', '10ft', '12x6', 'custom'
- `max_fargo` (Integer)
- `tournament_fee` (Numeric/Decimal)
- `side_pots` (JSONB) - Array of side pot information
- `chip_allocations` (JSONB) - Array of chip allocation information
- `status` (Text) - Values: 'active', 'approved', 'pending', 'deleted', 'fargo-rated', 'open-tournament'
- `required_fargo_games` (Integer, Nullable)
- `has_required_fargo_games` (Boolean)
- `green_fee` (Numeric, Nullable)
- `has_green_fee` (Boolean)
- `recurring_series_id` (UUID, Nullable)
- `is_recurring_master` (Boolean)
- `point_location` (Geography Point) - Format: POINT(longitude latitude)
- `venue_id` (Integer, Foreign Key to venues table)
- `parent_recurring_tournament_id` (Integer)
- `created_at` (Timestamp with timezone)
- `updated_at` (Timestamp with timezone)
- `deleted_at` (Timestamp with timezone, Nullable)

---

### 2. **VENUES** Table

Stores venue/bar information.

**Column Names:**

- `id` (Integer, Primary Key, Auto-increment)
- `venue` (Text) - Venue name (Note: column is named 'venue', not 'name')
- `address` (Text)
- `phone` (Text)
- `latitude` (Numeric) - Precise latitude coordinate
- `longitude` (Numeric) - Precise longitude coordinate
- `venue_lat` (Text) - Legacy latitude field
- `venue_lng` (Text) - Legacy longitude field
- `city` (Text)
- `state` (Text)
- `zip_code` (Text)
- `point_location` (Geography Point) - Format: POINT(longitude latitude)
- `td_id` (Integer, Nullable) - Tournament Director user ID
- `barowner_id` (Integer, Nullable) - Bar Owner user ID
- `profile_id` (Integer) - Legacy field
- `created_at` (Timestamp with timezone)
- `updated_at` (Timestamp with timezone)

---

### 3. **VENUE_TABLES** Table

Stores table information for each venue.

**Column Names:**

- `id` (Serial, Primary Key)
- `venue_id` (Integer, Foreign Key to venues.id)
- `table_size` (Text) - Values: '7ft', '8ft', '9ft', '10ft', '12x6'
- `table_brand` (Text) - Values: 'Diamond', 'Brunswick', 'Olhausen', 'Connelly', 'Imperial', 'Valley', 'Aramith', 'Gabriel Carom', 'Other'
- `count` (Integer) - Number of tables (1-99)
- `created_at` (Timestamp with timezone)
- `updated_at` (Timestamp with timezone)

---

### 4. **PROFILES** Table

User profile information (managed by Supabase Auth).

**Column Names:**

- `id` (UUID, Primary Key, linked to auth.users)
- `id_auto` (Integer, Unique, Auto-increment)
- `created_at` (Timestamp with timezone)
- `user_name` (Text, Unique)
- `email` (Text, Unique)
- `name` (Text)
- `preferred_game` (Text)
- `skill_level` (Text)
- `zip_code` (Text)
- `home_city` (Text)
- `home_state` (Text)
- `favorite_player` (Text)
- `favorite_game` (Text)
- `role` (Text) - Values: 'basic', 'compete-admin', 'bar-admin', 'tournament-director', 'master-administrator'
- `status` (Text) - Values: 'deleted', etc.
- `profile_image_url` (Text)
- `created_at_formatted` (Text)

---

### 5. **GIVEAWAYS** (Custom Content) Table

Stores giveaway/reward information.

**Column Names:**

- `id` (Integer, Primary Key)
- `created_at` (Timestamp)
- `name` (Text)
- `label_about_the_person` (Text)
- `address` (Text)
- `description` (Text)
- `list` (JSONB) - Array of list items
- `labels` (JSONB) - Array of labels
- `phone_number` (Text)
- `type` (Text) - Values: 'featured-player', 'featured-bar', 'rewards', 'reward'
- `reward_picture` (Text) - Image URL
- `reward_link` (Text)
- `value` (Numeric)
- `features` (Text)
- `giveawy_rules` (Text)
- `subtitle` (Text)
- `date_ends` (Timestamp)
- `entries` (Integer)
- `tournament_id_unique_number` (Integer, Nullable)
- `count_total_entries` (Integer)
- `logged_user_have_entered` (Boolean)

---

### 6. **SEARCH_ALERTS** Table

User-created search alerts for tournaments.

**Column Names:**

- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `creator_id` (UUID, Foreign Key to profiles)
- `name` (Text)
- `preffered_game` (Text)
- `tournament_format` (Text)
- `table_size` (Text)
- `fargo_range_from` (Integer)
- `fargo_range_to` (Integer)
- `max_entry_fee` (Numeric)
- `location` (Text)
- `reports_to_fargo` (Boolean)
- `checked_open_tournament` (Boolean)
- `maximum_fargo` (Integer)
- `required_fargo_games` (Integer)
- `date_from` (Date)
- `date_to` (Date)

---

### 7. **LIKES** Table

Tournament likes/favorites.

**Column Names:**

- `likeid` (Integer, Primary Key)
- `turnament_id` (UUID, Foreign Key) - Note: typo in column name
- `user_id` (UUID, Foreign Key to profiles)
- `created_at` (Timestamp)

---

### 8. **FEATURED_PLAYERS** Table

Featured player content.

**Column Names:**

- `id` (Integer, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `name` (Text)
- `label_about_the_person` (Text)
- `address` (Text)
- `description` (Text)
- `phone_number` (Text)
- `achievements` (JSONB) - Array of strings
- `is_active` (Boolean)
- `last_featured_date` (Timestamp)
- `featured_count` (Integer)
- `selection_weight` (Integer)
- `created_by` (UUID)
- `updated_by` (UUID)

---

### 9. **FEATURED_BARS** Table

Featured bar content.

**Column Names:**

- `id` (Integer, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `name` (Text)
- `address` (Text)
- `description` (Text)
- `phone_number` (Text)
- `highlights` (JSONB) - Array of strings
- `website` (Text)
- `hours_of_operation` (Text)
- `special_features` (Text)
- `is_active` (Boolean)
- `last_featured_date` (Timestamp)
- `featured_count` (Integer)
- `selection_weight` (Integer)
- `created_by` (UUID)
- `updated_by` (UUID)

---

### 10. **SUPPORT_MESSAGES** Table

User support messages.

**Column Names:**

- `id` (Integer, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `user_id` (UUID, Foreign Key)
- `user_email` (Text)
- `user_name` (Text)
- `message_type` (Text) - Values: 'General Question', 'Tournament Inquiry', 'Technical Support', 'Account Issue', 'Feedback / Suggestion'
- `message_content` (Text)
- `tournament_id` (UUID)
- `status` (Text) - Values: 'pending', 'in_progress', 'resolved'
- `is_read` (Boolean)
- `admin_response` (Text)
- `admin_user_id` (UUID)
- `responded_at` (Timestamp)

---

## How to Import Excel Data to Supabase

### Method 1: Using Supabase Dashboard (Recommended for Small Datasets)

1. **Prepare Your Excel File:**

   - Ensure column names in Excel **exactly match** the database column names above
   - Save your Excel file as **CSV format** (File → Save As → CSV)
   - Example for venues:
     ```
     venue,address,phone,city,state,zip_code,latitude,longitude
     "Joe's Pool Hall","123 Main St","555-1234","Austin","TX","78701",30.2672,-97.7431
     ```

2. **Access Supabase Dashboard:**

   - Go to https://supabase.com
   - Log in to your project
   - Navigate to **Table Editor** in the left sidebar

3. **Import CSV:**
   - Select the table you want to import to (e.g., `venues`)
   - Click the **"Insert"** dropdown → **"Import data from CSV"**
   - Upload your CSV file
   - Map columns if needed
   - Click **"Import"**

### Method 2: Using SQL Import (For Larger Datasets)

1. **Convert Excel to SQL INSERT Statements:**

   For **VENUES** example:

   ```sql
   INSERT INTO venues (venue, address, phone, city, state, zip_code, latitude, longitude)
   VALUES
   ('Joe''s Pool Hall', '123 Main St, Austin, TX', '555-1234', 'Austin', 'TX', '78701', 30.2672, -97.7431),
   ('Mike''s Billiards', '456 Oak Ave, Dallas, TX', '555-5678', 'Dallas', 'TX', '75201', 32.7767, -96.7970);
   ```

   For **TOURNAMENTS** example:

   ```sql
   INSERT INTO tournaments (
     tournament_name, game_type, format, director_name, venue, address,
     start_date, strart_time, tournament_fee, max_fargo, table_size,
     is_recurring, reports_to_fargo, is_open_tournament, status
   )
   VALUES
   ('Friday Night 9-Ball', '9-Ball', 'Double Elimination', 'John Smith',
    'Joe''s Pool Hall', '123 Main St, Austin, TX',
    '2024-01-15', '19:00', 25.00, 700, '9ft',
    false, true, true, 'active');
   ```

2. **Run SQL in Supabase:**
   - Go to **SQL Editor** in Supabase Dashboard
   - Paste your SQL INSERT statements
   - Click **"Run"**

### Method 3: Using Node.js Script (For Complex Imports)

I can create a custom import script for you. Here's an example:

```javascript
// import-venues.js
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');

async function importVenuesFromExcel(filePath) {
  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // Import each row
  for (const row of data) {
    const { data: result, error } = await supabase.from('venues').insert({
      venue: row.venue,
      address: row.address,
      phone: row.phone,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      latitude: row.latitude,
      longitude: row.longitude,
    });

    if (error) {
      console.error('Error importing row:', error);
    } else {
      console.log('Imported:', row.venue);
    }
  }
}

// Run the import
importVenuesFromExcel('./venues.xlsx');
```

---

## Excel Template Examples

### VENUES Template

| venue            | address     | phone    | city   | state | zip_code | latitude | longitude |
| ---------------- | ----------- | -------- | ------ | ----- | -------- | -------- | --------- |
| Joe's Pool Hall  | 123 Main St | 555-1234 | Austin | TX    | 78701    | 30.2672  | -97.7431  |
| Mike's Billiards | 456 Oak Ave | 555-5678 | Dallas | TX    | 75201    | 32.7767  | -96.7970  |

### TOURNAMENTS Template

| tournament_name | game_type | format             | director_name | venue           | address                 | start_date | strart_time | tournament_fee | max_fargo | table_size | is_recurring | reports_to_fargo | is_open_tournament | status |
| --------------- | --------- | ------------------ | ------------- | --------------- | ----------------------- | ---------- | ----------- | -------------- | --------- | ---------- | ------------ | ---------------- | ------------------ | ------ |
| Friday 9-Ball   | 9-Ball    | Double Elimination | John Smith    | Joe's Pool Hall | 123 Main St, Austin, TX | 2024-01-15 | 19:00       | 25             | 700       | 9ft        | FALSE        | TRUE             | TRUE               | active |

### VENUE_TABLES Template

| venue_id | table_size | table_brand | count |
| -------- | ---------- | ----------- | ----- |
| 1        | 9ft        | Diamond     | 8     |
| 1        | 7ft        | Brunswick   | 2     |
| 2        | 9ft        | Diamond     | 6     |

---

## Important Notes

1. **Required Fields:**

   - VENUES: `venue`, `address`
   - TOURNAMENTS: `tournament_name`, `game_type`, `format`, `start_date`, `status`
   - VENUE_TABLES: `venue_id`, `table_size`, `count`

2. **Data Formats:**

   - Dates: `YYYY-MM-DD` (e.g., 2024-01-15)
   - Times: `HH:MM` (e.g., 19:00 for 7:00 PM)
   - Booleans: `TRUE` or `FALSE` (or `true`/`false`)
   - Decimals: Use period as decimal separator (e.g., 25.50)

3. **Special Characters:**

   - Escape single quotes in SQL: `Joe's` → `Joe''s`
   - In CSV, wrap text with quotes if it contains commas

4. **Foreign Keys:**
   - `venue_id` in tournaments must reference an existing venue `id`
   - `venue_id` in venue_tables must reference an existing venue `id`

---

## Need Help?

Would you like me to:

1. Create a custom import script for your specific Excel file?
2. Generate SQL INSERT statements from your data?
3. Create Excel templates with sample data?
4. Help with data validation before import?

Just provide your Excel file or describe what data you want to import!
