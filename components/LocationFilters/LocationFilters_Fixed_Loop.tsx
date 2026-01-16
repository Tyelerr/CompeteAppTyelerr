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
  userProfile?: { zip_code?: string };
}) {
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [radius, setRadius] = useState<number>(25); // Default 25 miles

  // Track if user has manually edited the zip code
  const [userHasEditedZipCode, setUserHasEditedZipCode] =
    useState<boolean>(false);

  // Track if we've initialized with user's zip code
  const [hasInitializedUserZip, setHasInitializedUserZip] =
    useState<boolean>(false);

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

  // Initialize values from filters prop or user profile - ONLY ONCE on mount
  useEffect(() => {
    if (isUpdatingRef.current) return;

    let shouldUpdate = false;
    let newState = state;
    let newCity = city;
    let newZipCode = zipCode;
    let newRadius = radius;

    if (filters.state !== undefined && filters.state !== state) {
      newState = filters.state;
      shouldUpdate = true;
    }
    if (filters.city !== undefined && filters.city !== city) {
      newCity = filters.city;
      shouldUpdate = true;
    }
    if (filters.radius !== undefined && filters.radius !== radius) {
      newRadius = filters.radius;
      shouldUpdate = true;
    }

    // Handle zip code initialization
    if (
      !userHasEditedZipCode &&
      !hasInitializedUserZip &&
      userProfile?.zip_code
    ) {
      if (filters.zip_code !== undefined) {
        newZipCode = filters.zip_code;
      } else if (zipCode === '') {
        newZipCode = userProfile.zip_code;
        setHasInitializedUserZip(true);
        shouldUpdate = true;
      }
    } else if (
      filters.zip_code !== undefined &&
      !userHasEditedZipCode &&
      filters.zip_code !== zipCode
    ) {
      newZipCode = filters.zip_code;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      isUpdatingRef.current = true;
      setState(newState);
      setCity(newCity);
      setZipCode(newZipCode);
      setRadius(newRadius);

      // Update filters after state is set
      setTimeout(() => {
        updateFilters(newState, newCity, newZipCode, newRadius);
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [
    userProfile?.zip_code,
    filters.state,
    filters.city,
    filters.zip_code,
    filters.radius,
    userHasEditedZipCode,
    hasInitializedUserZip,
    state,
    city,
    zipCode,
    radius,
    updateFilters,
  ]);

  // Reset component when resetComponent prop changes
  useEffect(() => {
    if (resetComponent !== undefined) {
      console.log('=== RESET COMPONENT TRIGGERED ===');
      isUpdatingRef.current = true;

      setState('');
      setCity('');
      setZipCode('');
      setRadius(25);
      setUserHasEditedZipCode(false);
      setHasInitializedUserZip(false);

      // Force dropdown components to remount by changing key
      setResetKey((prev) => prev + 1);

      // Clear available cities arrays but keep states
      setAvailableCities([]);

      // Re-fetch states to ensure they're available after reset
      if (availableStates.length === 0) {
        fetchStatesFromVenues();
      }

      // Always clear all location filters completely on reset
      const clearedFilters: ITournamentFilters = {
        ...filters,
        state: undefined,
        city: undefined,
        zip_code: undefined,
        radius: 25,
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
            radius: 25,
          });
          isUpdatingRef.current = false;
        }, 200);
      } else {
        isUpdatingRef.current = false;
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

  const handleStateChange = (value: string) => {
    if (isUpdatingRef.current) return;
    setState(value);
    updateFilters(value, '', '', radius);
  };

  const handleCityChange = (value: string) => {
    if (isUpdatingRef.current) return;
    setCity(value);
    updateFilters(state, value, '', radius);
  };

  const handleZipCodeChange = (value: string) => {
    if (isUpdatingRef.current) return;
    setZipCode(value);
    setUserHasEditedZipCode(true);
    updateFilters(state, city, value, radius);
  };

  const handleRadiusChange = (value: number) => {
    if (isUpdatingRef.current) return;
    setRadius(value);
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
      {zipCode.trim() !== '' && (
        <View style={{ marginTop: BasePaddingsMargins.formInputMarginLess }}>
          <ZSlider
            type="single"
            label="Search Radius"
            min={5}
            max={100}
            initialValue={radius}
            valueTemplate="{v} miles"
            measurementTemplates={['{v} mile', '{v} miles']}
            onValueChange={handleRadiusChange}
            marginBottom={0}
          />
        </View>
      )}
    </View>
  );
}
