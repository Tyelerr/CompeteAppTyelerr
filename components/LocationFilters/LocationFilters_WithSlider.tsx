import { View, TouchableOpacity, Text } from 'react-native';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import { ITournamentFilters } from '../../hooks/InterfacesGlobal';
import LFInput from '../LoginForms/LFInput';
import { useEffect, useState } from 'react';
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

  // Initialize values from filters prop or user profile - ONLY ONCE on mount
  useEffect(() => {
    if (filters.state !== undefined) setState(filters.state);
    if (filters.city !== undefined) setCity(filters.city);
    if (filters.radius !== undefined) setRadius(filters.radius);

    // Only set user's zip code if they haven't manually edited it AND we haven't initialized yet
    if (
      !userHasEditedZipCode &&
      !hasInitializedUserZip &&
      userProfile?.zip_code
    ) {
      if (filters.zip_code !== undefined) {
        setZipCode(filters.zip_code);
      } else if (zipCode === '') {
        setZipCode(userProfile.zip_code);
        setHasInitializedUserZip(true);
        setTimeout(() => {
          onFiltersChange({
            ...filters,
            zip_code: userProfile.zip_code,
            radius: radius, // Include radius in filters
          });
        }, 100);
      }
    } else if (filters.zip_code !== undefined && !userHasEditedZipCode) {
      setZipCode(filters.zip_code);
    }
  }, [
    userProfile?.zip_code,
    filters.state,
    filters.city,
    filters.zip_code,
    filters.radius,
  ]);

  // Synchronize local state with filters prop changes (important for external resets)
  useEffect(() => {
    // Only sync if user hasn't manually edited the zip code
    if (!userHasEditedZipCode) {
      if (filters.state !== state) {
        setState(filters.state || '');
      }
      if (filters.city !== city) {
        setCity(filters.city || '');
      }
      if (filters.zip_code !== zipCode) {
        setZipCode(filters.zip_code || '');
      }
    }
    if (filters.radius !== radius) {
      setRadius(filters.radius || 25);
    }
  }, [
    filters.state,
    filters.city,
    filters.zip_code,
    filters.radius,
    userHasEditedZipCode,
  ]);

  // Add a key to force dropdown remount on reset
  const [resetKey, setResetKey] = useState<number>(0);

  // Reset component when resetComponent prop changes
  useEffect(() => {
    if (resetComponent !== undefined) {
      console.log('=== RESET COMPONENT TRIGGERED ===');
      setState('');
      setCity('');
      setZipCode('');
      setRadius(25); // Reset radius to default
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
        radius: 25, // Reset to default radius
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
        }, 200);
      }
    }
  }, [resetComponent, availableStates.length]);

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

  // Update parent filters when local state changes
  const updateFilters = (
    newState: string,
    newCity: string,
    newZipCode: string,
    newRadius: number,
  ) => {
    const updatedFilters: ITournamentFilters = {
      ...filters,
      state: newState !== '' ? newState : undefined,
      city: newCity !== '' ? newCity : undefined,
      zip_code: newZipCode !== '' ? newZipCode : undefined,
      radius: newRadius,
    };
    onFiltersChange(updatedFilters);
  };

  const handleStateChange = (value: string) => {
    setState(value);
    updateFilters(value, '', '', radius);
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    updateFilters(state, value, '', radius);
  };

  const handleZipCodeChange = (value: string) => {
    setZipCode(value);
    setUserHasEditedZipCode(true); // Mark that user has manually edited zip code
    updateFilters(state, city, value, radius);
  };

  const handleRadiusChange = (value: number) => {
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

      {/* Distance Slider */}
      {zipCode.trim() !== '' && (
        <View style={{ marginTop: BasePaddingsMargins.formInputMarginLess }}>
          <ZSlider
            type="single"
            label="Search Radius"
            min={5}
            max={100}
            initialValue={radius}
            onValueChange={handleRadiusChange}
            marginBottom={0}
          />
        </View>
      )}
    </View>
  );
}
