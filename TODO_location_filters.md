# Location Filters Implementation - Replace Radius Search

## Progress Tracking

### ✅ Completed

- [x] Analysis of current radius filter implementation
- [x] Plan creation for state/city/zip replacement
- [x] Create reusable LocationFilters component with cascading dropdowns
- [x] Update CrudTournament.tsx for state/city/zip filtering
- [x] Replace GoogleLocationRadius in ScreenBilliardHome.tsx
- [x] Add location fields to ScreenBilliardModalFilters.tsx
- [x] Implement side-by-side dropdown layout (State → City → Zip Code)
- [x] Add cascading dropdown logic (State enables City, City enables Zip)
- [x] Include zip radius slider (1-50 miles) when zip code is selected

### 🔄 Ready for Testing

- [ ] Test cascading dropdown functionality
- [ ] Test zip code radius slider (1-50 miles)
- [ ] Verify filter reset works for all location fields
- [ ] Ensure consistency between main screen and modal filters

### ⏳ Pending

- [ ] Final testing and validation

## Implementation Details

### New LocationFilters Component Features:

- State input field
- City input field
- Zip code input field
- Zip radius slider (1-50 miles)
- Reset functionality
- Consistent styling with existing components

### Backend Changes:

- Add state filtering: `query.ilike('state', `%${filters.state}%`)`
- Add city filtering: `query.ilike('city', `%${filters.city}%`)`
- Add zip code filtering: `query.ilike('zip_code', `%${filters.zip_code}%`)`
- Add zip radius filtering using PostGIS distance calculation

### UI Changes:

- Remove GoogleLocationRadius component usage
- Add LocationFilters component to main screen
- Add LocationFilters component to filters modal
- Update reset functionality to include new fields
