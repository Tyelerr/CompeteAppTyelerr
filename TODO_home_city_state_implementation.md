# Home City and State Implementation TODO

## Progress Tracking

### ✅ Completed

- [x] Plan creation and approval
- [x] Database schema updates
- [x] TypeScript interface updates
- [x] Profile editing UI updates
- [x] CRUD operations updates
- [x] Location filter integration

### 🔄 In Progress

- [ ] Testing and verification

### 📋 Implementation Steps

1. **Database Schema Updates**

   - [x] Create SQL file to add home_city and home_state columns to profiles table

2. **TypeScript Interface Updates**

   - [x] Add home_city and home_state to ICAUserData interface

3. **Profile Editing UI Updates**

   - [x] Add home city and state input fields to FormUserEditor.tsx
   - [x] Update form validation and save logic
   - [x] Add state management for new fields

4. **User Registration Updates**

   - [x] Add optional home city and state fields to registration form (via SignUp function)

5. **CRUD Operations Updates**

   - [x] Update SignUp function to handle new fields
   - [x] Update UpdateProfile function to include home_city and home_state

6. **Location Filter Integration**

   - [x] Update LocationFilters.tsx to use user's home_state as default
   - [x] Modify initialization logic for location filtering
   - [x] Update userProfile type to include home_state

7. **Testing and Verification**
   - [ ] Test profile editing functionality
   - [ ] Test location filtering with new home state defaults
   - [ ] Verify database schema changes work correctly

## Notes

- Goal: Enable filtering based on user's home state to match with tournaments' state column
- Future: Add "suggest tournament" button when no tournaments found in user's state
- Priority: Database schema → Interface → UI → CRUD → Location filtering
