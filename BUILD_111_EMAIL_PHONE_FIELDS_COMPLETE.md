# Build 111 - Email and Phone Number Fields Added ✅

## New Feature Implemented

Added Email and Phone Number fields to the giveaway entry form with comprehensive validation.

## Changes Made

### 1. Database Schema Updates

**File:** `CompeteApp/sql/add_email_phone_to_giveaway_entries.sql`

- Added `email` column (TEXT) to `giveaway_entries` table
- Added `phone_number` column (TEXT) to `giveaway_entries` table
- Created indexes for better query performance

**Action Required:** Run this SQL script in Supabase SQL Editor

### 2. Database Function Update

**File:** `CompeteApp/sql/update_fn_enter_giveaway_with_email_phone.sql`

- Updated `fn_enter_giveaway` function to accept new parameters:
  - `p_email TEXT DEFAULT NULL`
  - `p_phone_number TEXT DEFAULT NULL`
- Modified INSERT statement to include email and phone_number fields

**Action Required:** Run this SQL script in Supabase SQL Editor

### 3. ModalEnterGiveaway.tsx - Entry Form

**File:** `CompeteApp/screens/Shop/ModalEnterGiveaway.tsx`

**New Fields Added:**

- **Email Field** - Required, with email format validation
- **Phone Number Field** - Required, with US phone format validation (10 digits)

**Enhanced Name Field:**

- Now validates that name only contains letters, spaces, hyphens, and apostrophes
- Automatically filters out numbers and special characters as user types

**Validation Features:**

- Real-time input filtering for name field
- Auto-formatting for phone number: (XXX) XXX-XXXX
- Email format validation using regex
- Phone number validation (must be 10 digits)
- Name validation (letters, spaces, hyphens, apostrophes only)
- Visual error indicators (red borders)
- Detailed error messages for each field
- Comprehensive validation alert showing all errors

**State Management:**

- Added `email` state
- Added `phoneNumber` state
- Enhanced validation error handling
- Auto-reset all fields when modal closes

### 4. ScreenShop.tsx - RPC Integration

**File:** `CompeteApp/screens/Shop/ScreenShop.tsx`

**Updated Functions:**

- `enterGiveaway()` - Added email and phoneNumber parameters to RPC call
- `handleEnterGiveawayAgree()` - Updated type signature to include new fields

**RPC Call Parameters Added:**

- `p_email`: Email address (trimmed)
- `p_phone_number`: Phone number (digits only, formatted removed)

### 5. Build Number Update

**File:** `CompeteApp/app.json`

- iOS buildNumber: 110 → 111
- Android versionCode: 110 → 111

## Field Specifications

### Name Field

- **Type:** Text Input
- **Required:** Yes
- **Validation:** Only letters, spaces, hyphens ('), and apostrophes (')
- **Auto-filtering:** Numbers and special characters removed as user types
- **Auto-capitalize:** Words

### Birthday Field

- **Type:** Dropdown selectors (Month/Day/Year)
- **Required:** Yes
- **Validation:** Must be selected
- **Existing:** Already implemented

### Email Field

- **Type:** Text Input
- **Required:** Yes
- **Validation:** Must match email format (user@example.com)
- **Keyboard:** Email keyboard
- **Auto-capitalize:** None
- **Auto-correct:** Disabled

### Phone Number Field

- **Type:** Text Input
- **Required:** Yes
- **Validation:** Must be 10 digits (US format)
- **Auto-formatting:** (XXX) XXX-XXXX as user types
- **Keyboard:** Phone pad
- **Max Length:** 14 characters (formatted)
- **Storage:** Digits only (formatting stripped before saving)

## Database Migration Steps

### Step 1: Add Columns to giveaway_entries

```sql
-- Run: CompeteApp/sql/add_email_phone_to_giveaway_entries.sql
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;
```

### Step 2: Update fn_enter_giveaway Function

```sql
-- Run: CompeteApp/sql/update_fn_enter_giveaway_with_email_phone.sql
-- This updates the function to accept and store email and phone_number
```

## User Experience Flow

1. User clicks "Enter Giveaway"
2. Official Rules modal opens
3. User fills out required fields:
   - **Name** - Only letters, spaces, hyphens, apostrophes allowed
   - **Birthday** - Select from dropdowns
   - **Email** - Valid email format required
   - **Phone** - Auto-formats as (XXX) XXX-XXXX
4. User checks all required agreements
5. User clicks "I Agree & Continue"
6. Validation runs:
   - All fields checked for presence
   - Name validated for allowed characters
   - Email validated for proper format
   - Phone validated for 10 digits
7. If validation fails: Alert shows all errors
8. If validation passes: Entry submitted to database

## Validation Error Messages

- **Name empty:** "Full name is required"
- **Name invalid:** "Name can only contain letters, spaces, hyphens, and apostrophes"
- **Birthday empty:** "Birthday is required"
- **Email empty:** "Email is required"
- **Email invalid:** "Please enter a valid email address"
- **Phone empty:** "Phone number is required"
- **Phone invalid:** "Please enter a valid 10-digit US phone number"

## Technical Details

### Validation Functions

```typescript
isValidName(name: string): boolean
  - Regex: /^[a-zA-Z\s'-]+$/
  - Checks for letters, spaces, hyphens, apostrophes only

isValidEmail(email: string): boolean
  - Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  - Standard email format validation

isValidPhone(phone: string): boolean
  - Strips non-digits
  - Validates exactly 10 digits

formatPhoneNumber(value: string): string
  - Auto-formats as (XXX) XXX-XXXX
  - Handles partial input gracefully
```

### Data Storage

- **Name:** Trimmed, validated string
- **Birthday:** ISO date string
- **Email:** Trimmed, lowercase recommended
- **Phone:** Digits only (formatting removed)

## Files Modified

1. `CompeteApp/screens/Shop/ModalEnterGiveaway.tsx` - Added fields and validation
2. `CompeteApp/screens/Shop/ScreenShop.tsx` - Updated RPC call
3. `CompeteApp/app.json` - Build 111
4. `CompeteApp/sql/add_email_phone_to_giveaway_entries.sql` - Schema migration
5. `CompeteApp/sql/update_fn_enter_giveaway_with_email_phone.sql` - Function update

## Testing Checklist

- [ ] Run database migrations in Supabase
- [ ] Test name field - verify numbers/special chars are blocked
- [ ] Test email field - verify format validation
- [ ] Test phone field - verify auto-formatting
- [ ] Test phone field - verify 10-digit requirement
- [ ] Test validation errors display correctly
- [ ] Test successful entry submission
- [ ] Verify data saves correctly in database
- [ ] Test modal reset when closed
- [ ] Test all fields required before submission

## Status

✅ **BUILD 111 READY FOR DEPLOYMENT**

All code changes complete. Database migrations ready to run in Supabase.
