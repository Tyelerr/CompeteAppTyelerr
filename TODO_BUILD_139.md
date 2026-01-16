# BUILD 139 - Multiple Tournament Directors Implementation

## Task: Support Multiple Tournament Directors Per Venue

### Current Status: IN PROGRESS

## Checklist:

### Database Layer

- [ ] Apply junction table SQL to database (venue_tournament_directors)
- [ ] Optional: Migrate existing td_id data to junction table

### API Layer - CrudVenues.tsx

- [ ] Add `addTournamentDirectorToVenue()` function
- [ ] Add `removeTournamentDirectorFromVenue()` function
- [ ] Add `fetchVenueTournamentDirectors()` function
- [ ] Update `assignTournamentDirectorToVenue()` to use junction table

### API Layer - CrudBarOwner.tsx

- [ ] Update `FetchBarOwnerDirectors()` to query junction table

### Component Layer - ModalAssignTournamentDirector.tsx

- [ ] Update `assignTournamentDirector()` to use junction table (add, not replace)

### Component Layer - ScreenBarOwnerDashboard.tsx

- [ ] Restyle "My Tournament Directors" modal with gray theme (#141416)
- [ ] Wire up X button to call remove function
- [ ] Refresh directors list after removal

### Build Configuration

- [ ] Update build number to 139 in app.json

### Testing

- [ ] Test TD assignment (should add, not replace)
- [ ] Test TD removal functionality
- [ ] Test modal styling matches "Assign TD" modal
- [ ] Verify multiple TDs can be assigned to same venue
- [ ] Test that directors list refreshes after add/remove

## Notes:

- Red X button already exists in UI (per screenshot)
- Need to wire it up to actual remove functionality
- Modal background should be #141416 to match "Assign TD" modal
