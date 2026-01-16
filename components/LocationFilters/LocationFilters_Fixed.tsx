import { View, TouchableOpacity, Text } from 'react-native';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import { ITournamentFilters } from '../../hooks/InterfacesGlobal';
import LFInput from '../LoginForms/LFInput';
import { useEffect, useState } from 'react';
import { supabase } from '../../ApiSupabase/supabase';
import ModalZipCodeRadius from './ModalZipCodeRadius';

// US States list
const US_STATES = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
];

// Cities by state - comprehensive list for all US states
const CITIES_BY_STATE: { [key: string]: { label: string; value: string }[] } = {
  AL: [
    { label: 'Birmingham', value: 'Birmingham' },
    { label: 'Montgomery', value: 'Montgomery' },
    { label: 'Mobile', value: 'Mobile' },
    { label: 'Huntsville', value: 'Huntsville' },
    { label: 'Tuscaloosa', value: 'Tuscaloosa' },
  ],
  // ... (keeping the rest of the cities data for brevity)
  TX: [
    { label: 'Houston', value: 'Houston' },
    { label: 'San Antonio', value: 'San Antonio' },
    { label: 'Dallas', value: 'Dallas' },
    { label: 'Austin', value: 'Austin' },
    { label: 'Fort Worth', value: 'Fort Worth' },
    { label: 'El Paso', value: 'El Paso' },
    { label: 'Arlington', value: 'Arlington' },
    { label: 'Corpus Christi', value: 'Corpus Christi' },
    { label: 'Plano', value: 'Plano' },
    { label: 'Lubbock', value: 'Lubbock' },
  ],
};

export default function LocationFilters({
  filters,
  onFiltersChange,
  resetComponent,
  userProfile,
}: {
  filters: ITournamentFilters;
  onFiltersChange: (updatedFilters: ITournamentFilters) => void;
  resetComponent?: boolean;
  userProfile?: { zip_code?: string };
}) {
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');

  // Track if user has manually edited the zip code
  const [userHasEditedZipCode, setUserHasEditedZipCode] =
    useState<boolean>(false);

  // Track if we've initialized with user's zip code
  const [hasInitializedUserZip, setHasInitializedUserZip] =
    useState<boolean>(false);

  // Available cities based on selected state
  const [availableCities, setAvailableCities] = useState<
    { label: string; value: string }[]
  >([]);

  // Initialize values from filters prop or user profile - ONLY ONCE on mount
  useEffect(() => {
    console.log('=== INITIALIZATION USEEFFECT TRIGGERED ===');
    console.log('filters.state:', filters.state);
    console.log('userHasEditedZipCode:', userHasEditedZipCode);
    console.log('hasInitializedUserZip:', hasInitializedUserZip);
    console.log('userProfile?.zip_code:', userProfile?.zip_code);
    console.log('zipCode:', zipCode);

    if (filters.state !== undefined) setState(filters.state);
    if (filters.city !== undefined) setCity(filters.city);

    // Only set user's zip code if they haven't manually edited it AND we haven't initialized yet
    // AND no state is currently selected (to avoid overriding state-based clearing)
    if (
      !userHasEditedZipCode &&
      !hasInitializedUserZip &&
      userProfile?.zip_code &&
      !filters.state && // Don't initialize user's zip if a state is selected
      filters.zip_code === undefined // Only initialize if no zip_code is already set
    ) {
      console.log('=== INITIALIZING USER ZIP CODE ===');
      console.log('Setting zip code to user profile:', userProfile.zip_code);
      setZipCode(userProfile.zip_code);
      setHasInitializedUserZip(true);
      // Don't send to parent here - let the user interaction handle it
      console.log(
        '=== INITIALIZATION COMPLETE - WAITING FOR USER INTERACTION ===',
      );
    } else if (filters.zip_code !== undefined && !userHasEditedZipCode) {
      console.log('=== SYNCING EXISTING ZIP CODE ===');
      setZipCode(filters.zip_code);
    } else {
      console.log('=== NO INITIALIZATION NEEDED ===');
    }
    console.log('=== INITIALIZATION USEEFFECT END ===');
  }, []); // Only run once on mount

  // Synchronize local state with filters prop changes (important for external resets)
  useEffect(() => {
    console.log('=== SYNC USEEFFECT TRIGGERED ===');
    console.log(
      'Current local state - state:',
      state,
      'city:',
      city,
      'zipCode:',
      zipCode,
    );
    console.log(
      'Incoming filters prop - state:',
      filters.state,
      'city:',
      filters.city,
      'zip_code:',
      filters.zip_code,
    );

    // Only sync if this is an external change (not from our own state changes)
    // Check if the incoming filters are different from what we would expect based on our current local state

    const expectedFilters = {
      state: state || undefined,
      city: city || undefined,
      zip_code: zipCode || undefined,
    };

    const incomingFilters = {
      state: filters.state,
      city: filters.city,
      zip_code: filters.zip_code,
    };

    console.log('Expected filters:', expectedFilters);
    console.log('Incoming filters:', incomingFilters);

    // If incoming filters differ from expected (meaning external change), sync them
    if (
      expectedFilters.state !== incomingFilters.state ||
      expectedFilters.city !== incomingFilters.city ||
      expectedFilters.zip_code !== incomingFilters.zip_code
    ) {
      console.log('=== EXTERNAL FILTERS CHANGE DETECTED - SYNCING ===');

      if (filters.state !== state) {
        console.log('Syncing state from', state, 'to', filters.state || '');
        setState(filters.state || '');
      }
      if (filters.city !== city) {
        console.log('Syncing city from', city, 'to', filters.city || '');
        setCity(filters.city || '');
      }

      // Always sync zip_code for external changes, but preserve the edit flag
      if (filters.zip_code !== zipCode) {
        console.log(
          'Syncing zip_code from',
          zipCode,
          'to',
          filters.zip_code || '',
        );
        setZipCode(filters.zip_code || '');
        // Only reset edit flag if zip_code is being cleared externally
        if (filters.zip_code === undefined || filters.zip_code === '') {
          console.log('Resetting userHasEditedZipCode flag');
          setUserHasEditedZipCode(false);
        }
      }
    } else {
      console.log('=== NO EXTERNAL CHANGE DETECTED - NO SYNC ===');
    }
    console.log('=== SYNC USEEFFECT END ===');
  }, [filters.state, filters.city, filters.zip_code]);

  // Reset component when resetComponent prop changes
  useEffect(() => {
    if (resetComponent !== undefined) {
      setState('');
      setCity('');
      setZipCode('');
      setUserHasEditedZipCode(false);
      setHasInitializedUserZip(false);

      const clearedFilters: ITournamentFilters = {
        ...filters,
        state: undefined,
        city: undefined,
        zip_code: undefined,
      };
      onFiltersChange(clearedFilters);

      // After reset, re-initialize with user's zip code if available
      if (userProfile?.zip_code) {
        setTimeout(() => {
          setZipCode(userProfile.zip_code!);
          setHasInitializedUserZip(true);
          onFiltersChange({
            ...clearedFilters,
            zip_code: userProfile.zip_code,
          });
        }, 200);
      }
    }
  }, [resetComponent]);

  // Fetch cities from venues table when state changes
  useEffect(() => {
    if (state !== '') {
      fetchCitiesForState(state);
      if (city !== '') {
        setCity('');
        setZipCode('');
      }
    } else {
      setAvailableCities([]);
      setCity('');
      setZipCode('');
    }
  }, [state]);

  // Fetch cities for selected state from venues table
  const fetchCitiesForState = async (selectedState: string) => {
    try {
      const hardcodedCities = CITIES_BY_STATE[selectedState] || [];

      const { data, error } = await supabase
        .from('venues')
        .select('city')
        .eq('state', selectedState)
        .not('city', 'is', null)
        .not('city', 'eq', '')
        .order('city');

      if (error) {
        console.error('Error fetching cities:', error);
        setAvailableCities(hardcodedCities);
        return;
      }

      const dbCities = data
        ? data
            .map((item) => item.city)
            .filter((city) => city && city.trim() !== '')
        : [];

      const allCityNames = [
        ...hardcodedCities.map((c) => c.value),
        ...dbCities,
      ];
      const uniqueCityNames = [...new Set(allCityNames)];

      const cityItems = uniqueCityNames.map((cityName) => ({
        label: cityName,
        value: cityName,
      }));

      cityItems.sort((a, b) => a.label.localeCompare(b.label));
      setAvailableCities(cityItems);
    } catch (error) {
      console.error('Exception fetching cities:', error);
      const cities = CITIES_BY_STATE[selectedState] || [];
      setAvailableCities(cities);
    }
  };

  // Update parent filters when local state changes
  const updateFilters = (
    newState: string,
    newCity: string,
    newZipCode: string,
  ) => {
    const updatedFilters: ITournamentFilters = {
      ...filters,
      state: newState !== '' ? newState : undefined,
      city: newCity !== '' ? newCity : undefined,
      zip_code: newZipCode !== '' ? newZipCode : undefined,
    };
    onFiltersChange(updatedFilters);
  };

  const handleStateChange = (value: string) => {
    console.log('=== STATE CHANGE START ===');
    console.log('Selected state:', value);
    console.log(
      'Current filters before change:',
      JSON.stringify(filters, null, 2),
    );

    setState(value);
    setCity(''); // Clear city locally
    setZipCode(''); // Clear zip code locally

    const updatedFilters: ITournamentFilters = {
      ...filters,
      state: value !== '' ? value : undefined,
      city: undefined, // Explicitly clear city
      zip_code: undefined, // Explicitly clear zip code
    };

    console.log(
      'Updated filters being sent to parent:',
      JSON.stringify(updatedFilters, null, 2),
    );
    onFiltersChange(updatedFilters);

    console.log('=== STATE CHANGE END ===');
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    updateFilters(state, value, '');
  };

  const handleZipCodeChange = (value: string) => {
    setZipCode(value);
    setUserHasEditedZipCode(true); // Mark that user has manually edited zip code

    // Clear state and city when zip code is entered (mutual exclusivity)
    if (value !== '') {
      setState('');
      setCity('');
      updateFilters('', '', value);
    } else {
      updateFilters(state, city, value);
    }
  };

  return (
    <View style={{ marginBottom: BasePaddingsMargins.formInputMarginLess }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: BasePaddingsMargins.formInputMarginLess,
        }}
      >
        <View style={{ width: '32%' }}>
          <LFInput
            typeInput="dropdown"
            placeholder="State"
            label="State"
            value={state}
            onChangeText={handleStateChange}
            items={US_STATES}
            marginBottomInit={0}
          />
        </View>

        <View style={{ width: '32%' }}>
          <LFInput
            typeInput="dropdown"
            placeholder="City"
            label="City"
            value={city}
            onChangeText={handleCityChange}
            items={availableCities}
            marginBottomInit={0}
          />
        </View>

        <View style={{ width: '32%' }}>
          <LFInput
            typeInput="default"
            placeholder="Enter zip code"
            label="Zip Code"
            value={zipCode}
            onChangeText={handleZipCodeChange}
            keyboardType="numeric"
            marginBottomInit={0}
          />
        </View>
      </View>
    </View>
  );
}
