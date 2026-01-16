# Build 110 - Add Email and Phone Number to Giveaway Entry Form

## New Feature Request

Add Email and Phone Number fields to the giveaway entry form (ModalEnterGiveaway) below the Birthday field.

## Required Changes

### 1. Database Schema Update

**Table:** `giveaway_entries`
**New Columns:**

- `email` (TEXT) - Email address
- `phone_number` (TEXT) - Phone number

**SQL Migration:**

```sql
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;
```

### 2. ModalEnterGiveaway.tsx Updates

**State Variables to Add:**

- `email` - string state
- `phoneNumber` - string state

**UI Changes:**

- Add Email input field after Birthday
- Add Phone Number input field after Email
- Add validation for email format (optional but recommended)
- Add validation for phone format (optional but recommended)

**Props Interface Update:**

```typescript
onAgree: (
  id: string,
  agreements: {
    agree18: boolean;
    agreeRules: boolean;
    agreePrivacy: boolean;
    agreeOneEntry: boolean;
    marketingOptIn: boolean;
    fullName: string;
    birthday: string;
    email: string;          // NEW
    phoneNumber: string;    // NEW
  },
) => void;
```

### 3. ScreenShop.tsx Updates

**Function:** `enterGiveaway`
**RPC Call Update:**
Add new parameters:

- `p_email`
- `p_phone_number`

### 4. Database Function Update

**Function:** `fn_enter_giveaway`
**New Parameters:**

- `p_email TEXT DEFAULT NULL`
- `p_phone_number TEXT DEFAULT NULL`

**INSERT Statement Update:**
Include email and phone_number in the INSERT

### 5. Winner Display Updates

**ModalEditGiveaway.tsx:**
Update winner display to show email and phone if available

**ModalPickWinner.tsx:**
Update winner display to show email and phone if available

## Implementation Steps

1. Create SQL migration for database schema
2. Update ModalEnterGiveaway.tsx with new fields
3. Update ScreenShop.tsx RPC call
4. Update database function fn_enter_giveaway
5. Update winner display components
6. Test the complete flow

## Questions

- Should Email and Phone be required or optional fields?
- Should we validate email format?
- Should we validate phone format (US format, international, etc.)?
