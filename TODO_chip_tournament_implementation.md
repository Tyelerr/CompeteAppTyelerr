# Chip Tournament Implementation TODO

## Progress Tracking

### ✅ Completed

- [x] Analysis of current tournament submission system
- [x] Understanding of side pots implementation
- [x] Plan creation and approval
- [x] Update ITournament interface to include chip_allocations
- [x] Create SQL schema update for chip_allocations column
- [x] Update ScreenSubmit.tsx with conditional rendering and chip management
- [x] Update form validation logic
- [x] Update CrudTournament.tsx for database operations
- [x] Update tournament display modal to show chip allocations

### 🔄 In Progress

- [ ] Testing and verification
- [ ] Run SQL schema update on database

### 📋 Implementation Details

**Chip Tournament Requirements:**

- When format is "chip-tournament", hide Game Spot and Race fields
- Add chip allocation management similar to side pots
- Fields: "# of chips" (left) and "Fargo Range" (right)
- Example format: "700+ = 3 Chips", "699-640 = 4 Chips"
- Use same LFInputsGrid component with different labels

**Files to Modify:**

1. `CompeteApp/hooks/InterfacesGlobal.tsx` - Add chip_allocations to ITournament
2. `CompeteApp/screens/Submit/ScreenSubmit.tsx` - Main form logic
3. `CompeteApp/ApiSupabase/CrudTournament.tsx` - Database operations
4. `CompeteApp/screens/Billiard/ScreenBilliardModalTournament.tsx` - Display logic
5. SQL file for database schema

**Database Schema:**

- Add `chip_allocations` column to tournaments table (JSONB type)
- Similar structure to side_pots column
