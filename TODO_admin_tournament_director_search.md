# Admin Tournament Director Search Implementation

## Task Description

Implement searchable tournament director assignment in the admin venues screen.

## Requirements

1. ✅ Replace static user list with searchable input field
2. ✅ Dynamic filtering as user types
3. ✅ Show user details (name, ID, email) in search results
4. ✅ Click on basic user to promote them to tournament director role
5. ✅ Confirmation dialog before assignment
6. ✅ Integration with admin venues screen

## Current Issues

- The existing modal shows a static list of users instead of a searchable interface
- Need to fix the search functionality to work properly
- Need to integrate the modal into the admin venues screen

## Implementation Plan

1. Fix the existing ModalAssignTournamentDirector to use proper search interface
2. Add "Add Tournament Director" button to each venue in ScreenAdminVenues
3. Wire up the modal with proper venue selection
4. Test the complete flow

## Files to Modify

- CompeteApp/screens/Shop/ModalAssignTournamentDirector.tsx (fix search interface)
- CompeteApp/screens/Admin/ScreenAdminVenues.tsx (add integration)

## Status

- [x] Analysis complete
- [ ] Fix search modal interface
- [ ] Integrate with admin venues screen
- [ ] Testing and validation
