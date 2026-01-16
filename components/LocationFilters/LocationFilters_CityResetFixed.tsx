import { View, TouchableOpacity, Text } from 'react-native';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import { ITournamentFilters } from '../../hooks/InterfacesGlobal';
import LFInput from '../LoginForms/LFInput';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../ApiSupabase/supabase';
import ModalZipCodeRadius from './ModalZipCodeRadius';
import ZSlider from '../UI/ZSlider/ZSlider';

// All states and cities will be fetched dynamically from venues table

export default function LocationFilters({
  filters,
  onFiltersChange,
  resetComponent,
  userProfile,
}: {
  filters: ITournamentFilters;
  onFiltersChange: (updatedFilters: ITournamentFilters) => void;
  resetComponent?: boolean;
  userProfile?: { zip_code?: string; home_state?: string; home_city?: string };
}) {
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  // Two-state pattern for radius: live for UI, committed for API calls
  const [liveRadius, setLiveRadius] = useState<number>(25); // What user sees while sliding
  const [committedRadius, setCommittedRadius] = useState<number>(25); // What triggers API calls

  // Track if user has manually edited the zip code
  const [userHasEditedZipCode, setUserHasEditedZipCode] =
    useState<boolean>(false);

  // Track if we've initialized with user's zip code
  const [hasInitializedUserZip, setHasInitializedUserZip] =
    useState<boolean>(false);

  // Track if user is currently sliding to prevent external updates
  const isSlidingRadiusRef = useRef<boolean>(false);

  // Available states and cities fetched from venues table
  const [availableStates, setAvailableStates] = useState<
    { label: string; value: string }[]
  >([]);
  const [availableCities, setAvailableCities] = useState<
    { label: string; value: string }[]
  >([]);

  // Add a key to force dropdown remount on reset
  const [resetKey, setResetKey] = useState<number>(0);

  // Use ref to track if we're currently updating to prevent loops
  const isUpdatingRef = useRef(false);

  // Fetch all states from venues table
  const fetchStatesFromVenues = async () => {
    try {
      console.log('Fetching states from venues table...');
      const { data, error } = await supabase
        .from('venues')
        .select('state')
        .not('state', 'is', null)
        .not('state', 'eq', '')
        .order('state');

      if (error) {
        console.error('Error fetching states:', error);
        return;
      }

      // Remove duplicates and create dropdown items
      const uniqueStates = [...new Set(data.map((item) => item.state))];
      const stateItems = uniqueStates.map((stateName) => ({
        label: stateName,
        value: stateName,
      }));

      // Sort alphabetically
      stateItems.sort((a, b) => a.label.localeCompare(b.label));
      setAvailableStates(stateItems);
      console.log(`Loaded ${stateItems.length} states from venues table`);
    } catch (error) {
      console.error('Exception fetching states:', error);
    }
  };

  // Fetch cities for selected state from venues table
  const fetchCitiesForState = async (selectedState: string) => {
    try {
      console.log(`Fetching cities for state: ${selectedState}`);
      const { data, error } = await supabase
        .from('venues')
        .select('city')
        .eq('state', selectedState)
        .not('city', 'is', null)
        .not('city', 'eq', '')
        .order('city');

      if (error) {
        console.error('Error fetching cities:', error);
        return;
      }

      // Remove duplicates and create dropdown items
      const uniqueCities = [...new Set(data.map((item) => item.city))];
      const cityItems = uniqueCities.map((cityName) => ({
        label: cityName,
        value: cityName,
      }));

      // Sort alphabetically
      cityItems.sort((a, b) => a.label.localeCompare(b.label));
      setAvailableCities(cityItems);
      console.log(`Loaded ${cityItems.length} cities for ${selectedState}`);
    } catch (error) {
      console.error('Exception fetching cities:', error);
    }
  };

  // Fetch all states from venues table on component mount
  useEffect(() => {
    fetchStatesFromVenues();
  }, []);

  // Memoized update function to prevent unnecessary calls
  const updateFilters = useCallback(
    (
      newState: string,
      newCity: string,
      newZipCode: string,
      newRadius: number,
    ) => {
      if (isUpdatingRef.current) return; // Prevent loops

      const updatedFilters: ITournamentFilters = {
        ...filters,
        state: newState !== '' ? newState : undefined,
        city: newCity !== '' ? newCity : undefined,
        zip_code: newZipCode !== '' ? newZipCode : undefined,
        radius: newRadius,
      };

      // Only call onFiltersChange if something actually changed
      const hasChanged =
        filters.state !== updatedFilters.state ||
        filters.city !== updatedFilters.city ||
        filters.zip_code !== updatedFilters.zip_code ||
        filters.radius !== updatedFilters.radius;

      if (hasChanged) {
        console.log('=== LOCATION FILTERS CHANGED ===');
        console.log('Updated filters:', updatedFilters);
        onFiltersChange(updatedFilters);
      }
    },
    [filters, onFiltersChange],
  );

  // Initialize with user's home state immediately when userProfile is available
  useEffect(() => {
    if (isUpdatingRef.current) return;

    // CRITICAL FIX: Don't initialize with user's home state if user has manually edited zip code
    // This prevents the state from being populated when user is trying to enter a zip code
    if (userHasEditedZipCode) {
      console.log(
        '=== SKIPPING USER HOME STATE INIT - USER HAS EDITED ZIP CODE ===',
      );
      return;
    }

    // If we have a user profile with home state and the local state doesn't match
    // AND no zip code is currently entered (to avoid overriding zip code input)
    if (
      userProfile?.home_state &&
      state !== userProfile.home_state &&
      zipCode === ''
    ) {
      console.log('=== INITIALIZING WITH USER HOME STATE ===');
      console.log('Setting state to user home state:', userProfile.home_state);
      console.log('Current local state:', state);
      console.log('Current filters.state:', filters.state);
      console.log('Current zipCode:', zipCode);

      isUpdatingRef.current = true;
      setState(userProfile.home_state);

      // Also set home city if available
      if (userProfile?.home_city) {
        console.log('Setting city to user home city:', userProfile.home_city);
        setCity(userProfile.home_city);
      }

      // Update filters immediately if they don't already match
      if (filters.state !== userProfile.home_state) {
        setTimeout(() => {
          updateFilters(
            userProfile.home_state!,
            userProfile?.home_city || '',
            '',
            committedRadius,
          );
          isUpdatingRef.current = false;
        }, 0);
      } else {
        isUpdatingRef.current = false;
      }
    }
  }, [
    userProfile?.home_state,
    userProfile?.home_city,
    state,
    filters.state,
    committedRadius,
    zipCode,
    userHasEditedZipCode,
    updateFilters,
  ]);

  // Handle filter updates from parent component
  useEffect(() => {
    if (isUpdatingRef.current) return;

    let shouldUpdate = false;
    let newState = state;
    let newCity = city;
    let newZipCode = zipCode;
    let newRadius = committedRadius;

    // Handle explicit filter values from parent
    if (filters.state !== undefined && filters.state !== state) {
      newState = filters.state;
      shouldUpdate = true;
    }
    if (filters.city !== undefined && filters.city !== city) {
      newCity = filters.city;
      shouldUpdate = true;
    }

    // CRITICAL FIX: Only update zip code from parent if user hasn't manually edited it
    // This prevents the race condition where user input gets overridden
    if (
      filters.zip_code !== undefined &&
      filters.zip_code !== zipCode &&
      !userHasEditedZipCode
    ) {
      newZipCode = filters.zip_code;
      shouldUpdate = true;
    }

    // Always use filters.radius if it's defined, even if it's 0 (but not while sliding)
    if (filters.radius !== undefined && !isSlidingRadiusRef.current) {
      newRadius = filters.radius;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      isUpdatingRef.current = true;
      setState(newState);
      setCity(newCity);
      setZipCode(newZipCode);
      setLiveRadius(newRadius);
      setCommittedRadius(newRadius);

      // Update filters after state is set
      setTimeout(() => {
        updateFilters(newState, newCity, newZipCode, newRadius);
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [
    filters.state,
    filters.city,
    filters.zip_code,
    filters.radius,
    state,
    city,
    zipCode,
    committedRadius,
    userHasEditedZipCode,
    updateFilters,
  ]);

  // Reset component when resetComponent prop changes - FIXED VERSION
  useEffect(() => {
    if (resetComponent !== undefined) {
      console.log('=== RESET COMPONENT TRIGGERED ===');
      console.log('User profile home state:', userProfile?.home_state);
      console.log('User profile home city:', userProfile?.home_city);

      isUpdatingRef.current = true;

      // Reset to user's home state only, leave city empty for optional filtering
      const resetState = userProfile?.home_state || '';
      const resetCity = ''; // Always reset city to empty so user can optionally select

      setState(resetState);
      setCity(resetCity);
      setZipCode('');
      setLiveRadius(25);
      setCommittedRadius(25);
      setUserHasEditedZipCode(false);
      setHasInitializedUserZip(false);

      // Force dropdown components to remount by changing key
      setResetKey((prev) => prev + 1);

      // Clear available cities arrays initially
      setAvailableCities([]);

      // Re-fetch states to ensure they're available after reset
      if (availableStates.length === 0) {
        fetchStatesFromVenues();
      }

      // CRITICAL FIX: If user has a home state, fetch cities for that state
      if (resetState) {
        console.log('=== FETCHING CITIES FOR RESET STATE ===');
        console.log('Fetching cities for state:', resetState);

        // Use setTimeout to ensure state is set before fetching cities
        setTimeout(async () => {
          try {
            await fetchCitiesForState(resetState);
            console.log(
              'Cities fetched successfully for reset state:',
              resetState,
            );
          } catch (error) {
            console.error('Error fetching cities for reset state:', error);
          }
        }, 100);
      }

      // Update filters with user's home state only (no city pre-selected)
      const updatedFilters: ITournamentFilters = {
        ...filters,
        state: resetState || undefined,
        city: undefined, // Always undefined so city dropdown shows placeholder
        zip_code: undefined,
        radius: 25,
      };

      console.log('=== RESET FILTERS BEING APPLIED ===');
      console.log('Updated filters:', updatedFilters);

      onFiltersChange(updatedFilters);

      isUpdatingRef.current = false;
    }
  }, [resetComponent]); // FIXED: Only depend on resetComponent to prevent infinite loops

  // Fetch cities from venues table when state changes
  useEffect(() => {
    if (state !== '') {
      fetchCitiesForState(state);
      // Only clear city and zip code if city is not empty (avoid clearing while typing)
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

  const handleStateChange = (value: string) => {
    if (isUpdatingRef.current) return;
    console.log('=== STATE CHANGE HANDLER ===');
    console.log('Selected state:', value);
    console.log('Previous zip code:', zipCode);

    setState(value);

    // Clear city and zip code when state changes (mutual exclusivity)
    setCity('');
    setZipCode('');

    // Reset zip code edit flag since we're clearing it programmatically
    setUserHasEditedZipCode(false);

    // Update filters with cleared zip code
    updateFilters(value, '', '', committedRadius);

    console.log('State changed, cleared city and zip code');
  };

  const handleCityChange = (value: string) => {
    if (isUpdatingRef.current) return;
    console.log('=== CITY CHANGE HANDLER ===');
    console.log('Selected city:', value);
    console.log('Previous zip code:', zipCode);

    setCity(value);

    // Only clear zip code if city is not empty (user selected a city)
    if (value !== '') {
      setZipCode('');
      // Reset zip code edit flag since we're clearing it programmatically
      setUserHasEditedZipCode(false);
    }

    // Update filters with cleared zip code
    updateFilters(state, value, '', committedRadius);

    console.log('City changed, cleared zip code');
  };

  const handleZipCodeChange = (value: string) => {
    if (isUpdatingRef.current) return;
    console.log('=== ZIP CODE CHANGE HANDLER ===');
    console.log('Entered zip code:', value);
    console.log('Previous state:', state);
    console.log('Previous city:', city);

    setZipCode(value);
    setUserHasEditedZipCode(true);

    // Clear state and city when zip code is entered (mutual exclusivity)
    if (value !== '') {
      console.log('Zip code entered, clearing state and city');
      setState('');
      setCity('');
      // Clear available cities since state is being cleared
      setAvailableCities([]);
      updateFilters('', '', value, committedRadius);
      console.log('State and city cleared, filters updated with zip code');
    } else {
      // If zip code is cleared, keep existing state/city
      updateFilters(state, city, value, committedRadius);
      console.log('Zip code cleared, keeping existing state/city');
    }
  };

  // Handle live radius changes (UI updates only, no API calls)
  const handleRadiusLiveChange = (value: number) => {
    if (isUpdatingRef.current) return;
    console.log('=== RADIUS LIVE CHANGE ===');
    console.log('Live radius value:', value);

    // Update live radius for immediate UI feedback
    setLiveRadius(value);

    // Do NOT call updateFilters here - this prevents API calls during sliding
  };

  // Handle radius commit (final value, triggers API calls)
  const handleRadiusCommit = (value: number) => {
    if (isUpdatingRef.current) return;
    console.log('=== RADIUS COMMIT ===');
    console.log('Committed radius value:', value);

    // Update both live and committed values
    setLiveRadius(value);
    setCommittedRadius(value);

    // Now trigger the API call with the final committed value
    updateFilters(state, city, zipCode, value);
  };

  return (
    <View style={{ marginBottom: BasePaddingsMargins.formInputMarginLess }}>
      {/* State, City, Zip Code Row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: BasePaddingsMargins.formInputMarginLess,
        }}
      >
        <View style={{ width: '32%' }}>
          <LFInput
            key={`state-${resetKey}`}
            typeInput="dropdown"
            placeholder="State"
            label="State"
            value={state}
            onChangeText={handleStateChange}
            items={availableStates}
            marginBottomInit={0}
          />
        </View>

        <View style={{ width: '32%' }}>
          <LFInput
            key={`city-${resetKey}`}
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

      {/* Distance Slider - Always show when zip code is entered */}
      {zipCode && typeof zipCode === 'string' && zipCode.trim() !== '' && (
        <View style={{ marginTop: BasePaddingsMargins.formInputMarginLess }}>
          <ZSlider
            type="single"
            label="Search Radius"
            min={0}
            max={100}
            initialValue={liveRadius}
            valueTemplate="{v} miles"
            measurementTemplates={['{v} mile', '{v} miles']}
            onValueChange={handleRadiusLiveChange}
            onSlidingComplete={handleRadiusCommit}
            marginBottom={0}
          />
        </View>
      )}
    </View>
  );
}
