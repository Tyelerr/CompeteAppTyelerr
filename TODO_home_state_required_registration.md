# Home State Required in Registration - Implementation TODO

## Progress Tracking

### ✅ Completed

- [x] Add US States constant list
- [x] Update FormCreateNewUser.tsx with home state/city fields
- [x] Update form validation to require home state
- [x] Update form submission to handle home state/city
- [x] Update AdminAuthHelpers for admin user creation
- [x] Add home_city and home_state fields to profile creation

### 🔄 Ready for Testing

- [ ] Test new user registration with required home state
- [ ] Test admin user creation includes home state
- [ ] Verify form validation works correctly
- [ ] Test that home state is saved to database

### 📋 Implementation Steps Completed

1. **Add US States Constant** ✅

   - [x] Created comprehensive US states list in constants.tsx

2. **Update New User Registration Form** ✅

   - [x] Added home state dropdown (required)
   - [x] Added home city input (optional)
   - [x] Updated form validation logic to require home state
   - [x] Updated state management
   - [x] Added proper error handling for missing home state

3. **Update CRUD Operations** ✅

   - [x] Modified form submission to accept home state/city
   - [x] Updated AdminAuthHelpers to include home state/city in profile creation
   - [x] Ensured profile creation includes these fields

4. **Testing and Verification** 🔄
   - [ ] Test new user registration with required home state
   - [ ] Test admin user creation includes home state
   - [ ] Verify form validation works correctly
   - [ ] Test that home state is saved to database

## Implementation Summary

### Files Modified:

1. **CompeteApp/hooks/constants.tsx** - Added US_STATES array with all 50 states + DC
2. **CompeteApp/screens/ProfileLoginRegister/FormCreateNewUser.tsx** - Added home state/city fields, validation, and form handling
3. **CompeteApp/ApiSupabase/AdminAuthHelpers.ts** - Updated profile creation to include home_city and home_state fields

### Key Features Implemented:

- Home state is now **required** for new user registration
- Home city is **optional** for new user registration
- Form validation prevents submission without home state selection
- Proper error messages for missing home state
- US states dropdown with all 50 states + District of Columbia
- Integration with existing admin user creation workflow
- Form clearing after successful submission

### Technical Details:

- Home state validation: `homeState.trim().length > 0`
- Form fields use LFInput component with dropdown for states
- Error handling with user-friendly messages
- Consistent with existing profile editor implementation
- Maintains backward compatibility with existing users

## Notes

- Goal: Make home state a required field when creating new user accounts ✅
- Home city remains optional ✅
- Ensure consistency with existing profile editor implementation ✅
- Maintain backward compatibility with existing users ✅
- Ready for testing and deployment
