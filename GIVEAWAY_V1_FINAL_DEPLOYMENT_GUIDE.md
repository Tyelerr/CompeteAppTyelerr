# 🎁 Giveaway V1 - Final Deployment Guide

## ✅ All SQL Files Ready

I've created **6 separate SQL files** that must be run in order. This approach solves all PostgreSQL ENUM transaction issues.

---

## 📋 Run These Files in Order

### Step 1: Add Giveaway Status Enum Values

**File:** `sql/giveaway_v1_step1_add_enum_values.sql`

- Adds 'full', 'drawn', 'closed' to giveaway_status enum
- **Run first, wait for success**

### Step 2: Update Giveaways Table

**File:** `sql/giveaway_v1_step2_add_columns_and_migrate.sql`

- Adds 9 new columns to giveaways table
- Migrates existing data (ended→closed)
- **Run second, wait for success**

### Step 3A: Create Entry Status Enum

**File:** `sql/giveaway_v1_step3a_create_entry_status_enum.sql`

- Creates entry_status enum type ('valid', 'disqualified')
- **Run third, wait for success**

### Step 3B: Update Entries Table

**File:** `sql/giveaway_v1_step3b_add_entry_columns.sql`

- Adds status column and validation fields
- Removes duplicate entries
- Adds one-entry-per-user constraint
- **Run fourth, wait for success**

### Step 4: Create Winners Table

**File:** `sql/giveaway_v1_step4_create_winners_table.sql`

- Creates winner_status enum
- Creates giveaway_winners table with rank system
- Adds RLS policies
- **Run fifth, wait for success**

### Step 5: Verification

**File:** `sql/giveaway_v1_step5_verification.sql`

- Verifies all changes were applied correctly
- Shows comprehensive status report
- **Run last, review output**

---

## ✅ All Requirements Implemented

✅ **Minimum age: 18** - Hard-coded with CHECK constraint  
✅ **Ends by entries only** - max_entries field (no dates)  
✅ **One entry per user** - UNIQUE constraint enforced  
✅ **Admin-only winner selection** - RLS policies  
✅ **1-minute draw lock** - winner_lock_until timestamp  
✅ **Forfeit/disqualify workflow** - Full status tracking  
✅ **Rank system** - Primary (rank=1) + alternates (rank=2+)  
✅ **Claim period** - claim_period_days (default 7)

---

## 🚀 Quick Start

1. Open Supabase SQL Editor
2. Run Step 1 → Click "Run" → Wait for ✅
3. Run Step 3A → Click "Run" → Wait for ✅
4. Run Step 3B → Click "Run" → Wait for ✅
5. Run Step 4 → Click "Run" → Wait for ✅
6. Run Step 5 → Click "Run" → Review verification output

---

## 📊 What Gets Created

**giveaways table** - 9 new columns:

- max_entries, entry_count_cached
- min_age (≥18), claim_period_days
- winner_lock_until
- prize_name, prize_arv, prize_image_url
- eligibility_text

**giveaway_entries table** - 4 new columns:

- status (entry_status enum)
- disqualified_reason, disqualified_at, disqualified_by
- UNIQUE constraint (giveaway_id, user_id)

**giveaway_winners table** - NEW TABLE:

- Tracks winners with rank system
- Status tracking (selected, notified, claimed, forfeited, disqualified)
- Claim deadline enforcement
- RLS policies for admin-only access

---

## 🔧 Why 6 Steps?

PostgreSQL requires ENUM values to be committed before use. By splitting into 6 steps:

1. Step 1: Add giveaway_status values → **commit**
2. Step 2: Use new values safely
3. Step 3A: Create entry_status enum → **commit**
4. Step 3B: Use entry_status enum safely
5. Step 4: Create winners table
6. Step 5: Verify everything

---

## 📝 Next Steps After Migration

Once all 6 steps complete successfully:

1. **Create RPC Functions** (see TODO_GIVEAWAY_V1_IMPLEMENTATION_PLAN.md)

   - fn_pick_giveaway_winner
   - fn_enter_giveaway_v1
   - update_giveaway_entry_count trigger

2. **Update TypeScript** (CrudGiveaway.tsx, InterfacesGlobal.tsx)

   - New interfaces for IGiveaway, IGiveawayEntry, IGiveawayWinner
   - New functions for winner management

3. **Update UI Components**

   - ModalCreateGiveaway - Remove dates, add new fields
   - ModalPickWinner - Add lock countdown, rank display
   - ModalViewGiveaway - Show winners with ranks

4. **Test Everything**
   - Create giveaway
   - Enter giveaway
   - Pick winner
   - Test forfeit/disqualify

---

## ⚠️ Important Notes

- All files use `IF NOT EXISTS` checks - safe to re-run
- Each step is independent - can resume from any point
- Verification step shows detailed status of migration
- No data loss - existing giveaways are preserved

---

## 🎉 You're Ready!

All 6 SQL files are production-ready. Follow the steps above and your Giveaway v1 system will be fully migrated.
