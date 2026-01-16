# Tournament Director Submit Page Enhancement

## Completed ✅

1. **Fixed PGRST116 Error in CrudVenues.tsx**

   - Updated `assignTournamentDirectorToVenue` function to use array queries instead of `.single()`
   - Added proper error handling for venue existence checks
   - Fixed the "JSON object requested, multiple (or no) rows returned" error

2. **Added New API Functions**

   - `fetchVenuesForTournamentDirector(userIdAuto)` - Gets venues assigned to a TD
   - `fetchVenueTableInfo(venueId)` - Gets table information for a specific venue

3. **Created Enhanced Tournament Director Component**
   - `LFDropdownTournamentDirectorVenues.tsx` - Smart venue and table selection component
   - Features:
     - Shows only venues assigned to the current tournament director
     - Automatic table size dropdown based on venue's available tables
     - Smart table brand selection (auto-selects if only one brand)
     - Dynamic table count validation based on available tables
     - Proper validation flow: venue → table size → brand (if multiple) → count

## Next Steps 🚧

### 1. Integrate Tournament Director Component in ScreenSubmit.tsx

Add state variables:

```typescript
// Tournament Director venue selection states
const [selectedTDVenue, setSelectedTDVenue] = useState<IVenue | null>(null);
const [selectedTDTableSize, setSelectedTDTableSize] = useState<string>('');
const [selectedTDTableBrand, setSelectedTDTableBrand] = useState<string>('');
const [selectedTDTableCount, setSelectedTDTableCount] = useState<number>(0);
const [availableTDTableCount, setAvailableTDTableCount] = useState<number>(0);
```

### 2. Add User Role Detection

Check if user is Tournament Director and show appropriate venue selection:

```typescript
import { EUserRole } from '../../hooks/InterfacesGlobal';

// In component logic
const isTournamentDirector = user?.role === EUserRole.TournamentDirector;
```

### 3. Replace Venue Selection Logic

Replace the existing venue selection section with:

```jsx
{/* Tournament Director Smart Venue Selection */}
{isTournamentDirector && (
  <LFDropdownTournamentDirectorVenues
    selectedVenueId={selectedTDVenue?.id}
    selectedTableSize={selectedTDTableSize}
    selectedTableBrand={selectedTDTableBrand}
    selectedTableCount={selectedTDTableCount}
    onVenueChange={(venue) => {
      setSelectedTDVenue(venue);
      __selectVenue(venue); // Use existing venue selection logic
    }}
    onTableSizeChange={(tableSize, availableCount) => {
      setSelectedTDTableSize(tableSize);
      setAvailableTDTableCount(availableCount);
      set_tableSize(tableSize); // Update form state
    }}
    onTableBrandChange={(brand) => {
      setSelectedTDTableBrand(brand);
    }}
    onTableCountChange={(count) => {
      setSelectedTDTableCount(count);
      set_numberOfTables(count.toString()); // Update form state
    }}
  />
)}

{/* Existing venue selection for other user types */}
{!isTournamentDirector && (
  <>
    <VenuesEditor
      barOwner={user as ICAUserData}
      sendBackTheValues={(venue: IVenue) => {
        __selectVenue(venue);
      }}
    />
    <LFDropdownVenues
      listType="my-venues"
      onChange={(venue: IVenue) => {
        __selectVenue(venue);
      }}
    />
    <LFDropdownVenues
      listType="venues-i-am-added-on"
      onChange={(venue: IVenue) => {
        __selectVenue(venue);
      }}
    />
  </>
)}
```

### 4. Update Form Validation

Remove manual table size and count inputs for Tournament Directors since they're handled by the smart component:

```jsx
{
  /* Hide manual table inputs for Tournament Directors */
}
{
  !isTournamentDirector && (
    <>
      <LFInput
      // ... existing table size input
      />
      <LFInput
      // ... existing number of tables input
      />
    </>
  );
}
```

### 5. Update Validation Logic

Modify validation array to handle Tournament Director logic:

```typescript
const _validationsArray: IFormInputValidation[] = [
  // ... existing validations
  // Conditional validation for table count based on user role
  ...(isTournamentDirector
    ? [
        {
          value: selectedTDTableCount.toString(),
          validations: [
            EInputValidation.Required,
            EInputValidation.GreatThenZero,
          ],
        },
      ]
    : [
        {
          value: numberOfTables,
          validations: [
            EInputValidation.Required,
            EInputValidation.GreatThenZero,
          ],
        },
      ]),
];
```

## Benefits of This Implementation 🎯

1. **Smart Validation**: Tournament directors can only select venues they're assigned to
2. **Automatic Table Logic**: Table sizes, brands, and counts are automatically populated based on venue configuration
3. **Proper Validation Flow**: Ensures users select table size before count, preventing invalid combinations
4. **Better UX**: Clear guidance messages and automatic selections where appropriate
5. **Data Integrity**: Prevents tournaments from being created with invalid table configurations

## Testing Checklist 📋

- [ ] Tournament Director can see only assigned venues
- [ ] Table size dropdown shows only available sizes for selected venue
- [ ] Table brand selection works correctly (auto-select for single brand)
- [ ] Table count validation respects available tables
- [ ] Form submission works with new venue/table data
- [ ] Other user roles still see existing venue selection options
- [ ] Error handling works properly when no venues are assigned

## Files Modified 📁

1. `CompeteApp/ApiSupabase/CrudVenues.tsx` - Fixed PGRST116 error, added new functions
2. `CompeteApp/components/LoginForms/LFDropdownTournamentDirectorVenues.tsx` - New smart component
3. `CompeteApp/screens/Submit/ScreenSubmit.tsx` - Import added (integration pending)
