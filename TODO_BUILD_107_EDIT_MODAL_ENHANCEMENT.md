# Build 107 - Edit Giveaway Modal Enhancement

## Current Status

✅ "Pick Winner" button now opens Edit Giveaway modal
⚠️ TypeScript error: VRow status type incompatible with IGiveawayEdit status type
❌ Edit modal doesn't show winner information
❌ Edit modal doesn't have "Pick Winner" button

## Required Changes

### 1. Fix Type Compatibility Issue

**Problem:** VRow has status types: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived'
**ModalEditGiveaway expects:** 'active' | 'ended' | 'awarded' | 'archived'

**Solution:** Update IGiveawayEdit type to match VRow status types

### 2. Add Winner Information Section to Edit Modal

**Features needed:**

- Load winners from `giveaway_winners` table
- Display all previous winners with:
  - Entry number
  - Winner name
  - Pick timestamp
  - Notification status
- Show "No winner selected yet" if no winners

### 3. Add Pick Winner Button

**Features needed:**

- "Pick Winner" button (if no winners)
- "Pick Another Winner" button (if winners exist)
- Opens ModalPickWinner as a nested modal
- Refreshes winner data after selection

### 4. Ensure Proper Data Flow

- Giveaway ID correctly passed to winner queries
- Winner data refreshes after new selection
- Edit modal stays open after picking winner
- Pick Winner modal closes after selection

## Implementation Plan

### File: `ModalEditGiveaway.tsx`

**Changes:**

1. Update IGiveawayEdit type to include all status types
2. Add state for winners data
3. Add state for Pick Winner modal visibility
4. Add useEffect to load winners when modal opens
5. Add "Winner Information" section in ScrollView
6. Add "Pick Winner" button in footer (conditionally)
7. Add ModalPickWinner component
8. Add winner picked callback to refresh data

### File: `ScreenShop.tsx`

**Changes:**

1. Remove unused Pick Winner modal state (now handled in Edit modal)
2. Ensure handleWinnerPicked is accessible or passed to Edit modal

## Next Steps

1. Update ModalEditGiveaway.tsx with all enhancements
2. Test the complete flow
3. Verify winner data displays correctly
4. Verify redraw functionality works
