import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { createVenue } from '../../ApiSupabase/CrudVenues';
import { IVenue, IVenueTable } from '../../hooks/InterfacesGlobal';
import VenueTableManager from '../../components/VenueTableManagerNew';
import GeoapifyAddressAutocomplete from '../../components/LocationFilters/GeoapifyAddressAutocomplete';
import { GeoapifyAutocompleteResult } from '../../ApiSupabase/GeoapifyService';

interface GoogleVenueData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

interface ModalCreateVenueEnhancedProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (venue: IVenue) => void;
  prefilledData?: GoogleVenueData;
  barownerId?: number;
  editingVenue?: IVenue;
}

const ModalCreateVenueEnhanced: React.FC<ModalCreateVenueEnhancedProps> = ({
  visible,
  onClose,
  onCreated,
  prefilledData,
  barownerId,
  editingVenue,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [useAutocomplete, setUseAutocomplete] = useState(true);
  const [tables, setTables] = useState<
    Omit<IVenueTable, 'id' | 'venue_id' | 'created_at' | 'updated_at'>[]
  >([]);

  // Pre-fill form when prefilledData or editingVenue is provided
  useEffect(() => {
    if (editingVenue) {
      setName(editingVenue.venue || '');
      setAddress(editingVenue.address || '');
      setCity('');
      setState('');
      setZipCode('');
      setPhone(editingVenue.phone || '');
      setLatitude(editingVenue.latitude || null);
      setLongitude(editingVenue.longitude || null);

      if (editingVenue.tables && Array.isArray(editingVenue.tables)) {
        const venueTables = editingVenue.tables.map((table: any) => ({
          table_size: table.table_size,
          table_brand: table.table_brand || 'Diamond',
          count: table.count || 1,
        }));
        setTables(venueTables);
      } else {
        setTables([]);
      }
    } else if (prefilledData) {
      setName(prefilledData.name || '');
      setAddress(prefilledData.address || '');
      setCity(prefilledData.city || '');
      setState(prefilledData.state || '');
      setZipCode(prefilledData.zipCode || '');
      setPhone(prefilledData.phone || '');
      setLatitude(null);
      setLongitude(null);
      setTables([]);
    } else if (visible) {
      // Reset form when opening without prefilled data
      setName('');
      setAddress('');
      setCity('');
      setState('');
      setZipCode('');
      setPhone('');
      setLatitude(null);
      setLongitude(null);
      setTables([]);
    }
  }, [prefilledData, editingVenue, visible]);

  const handleAddressSelect = (selectedAddress: GeoapifyAutocompleteResult) => {
    console.log('Address selected:', selectedAddress);

    // Auto-populate all address fields
    setAddress(selectedAddress.formatted);
    setCity(selectedAddress.city || '');
    setState(selectedAddress.state || '');
    setZipCode(selectedAddress.postcode || '');

    // Store coordinates for accurate venue location
    if (selectedAddress.lat && selectedAddress.lon) {
      setLatitude(selectedAddress.lat);
      setLongitude(selectedAddress.lon);
    }
  };

  const submit = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Validation Error', 'Venue name and address are required.');
      return;
    }

    // If using autocomplete and we have coordinates, city/state are optional
    // If not using autocomplete, require city and state
    if (!useAutocomplete && (!city.trim() || !state.trim())) {
      Alert.alert(
        'Validation Error',
        'City and state are required when not using address autocomplete.',
      );
      return;
    }

    setLoading(true);
    try {
      const venueData = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip_code: zipCode.trim() || undefined,
        phone: phone.trim() || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        barowner_id: barownerId,
        tables: tables.length > 0 ? tables : undefined,
      };

      console.log('Creating venue with data:', venueData);

      const venue = await createVenue(venueData);
      if (venue) {
        onCreated(venue);
        // Reset form
        setName('');
        setAddress('');
        setCity('');
        setState('');
        setZipCode('');
        setPhone('');
        setLatitude(null);
        setLongitude(null);
        setTables([]);

        Alert.alert(
          'Success',
          `Venue "${venue.venue}" created successfully!${
            latitude && longitude
              ? ' Location coordinates have been saved for accurate mapping.'
              : ''
          }`,
        );
      } else {
        Alert.alert('Error', 'Failed to create venue.');
      }
    } catch (error) {
      console.error('Error creating venue:', error);
      Alert.alert('Error', 'Failed to create venue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            padding: 18,
          }}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#141416',
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              borderRadius: 14,
              padding: 16,
              width: '100%',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontWeight: '800',
                fontSize: 16,
                marginBottom: 16,
              }}
            >
              {editingVenue
                ? `Editing "${editingVenue.venue}"`
                : 'Create New Venue'}
            </Text>

            <ScrollView
              style={{ maxHeight: 500 }}
              contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {/* Venue Name */}
              <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                Venue Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter venue name"
                placeholderTextColor="#6b7280"
                style={{
                  color: 'white',
                  borderWidth: 1,
                  borderColor: BaseColors.PanelBorderColor,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 16,
                  backgroundColor: '#16171a',
                }}
              />

              {/* Address Autocomplete Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                  Smart Address Input
                </Text>
                <TouchableOpacity
                  onPress={() => setUseAutocomplete(!useAutocomplete)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: useAutocomplete
                      ? BaseColors.primary
                      : BaseColors.secondary,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {useAutocomplete ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Address Input - Autocomplete or Manual */}
              {useAutocomplete ? (
                <GeoapifyAddressAutocomplete
                  label="Address *"
                  placeholder="Start typing venue address..."
                  value={address}
                  onAddressSelect={handleAddressSelect}
                  onTextChange={setAddress}
                  countryCode="us"
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <>
                  <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                    Address *
                  </Text>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Street address"
                    placeholderTextColor="#6b7280"
                    style={{
                      color: 'white',
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 16,
                      backgroundColor: '#16171a',
                    }}
                  />
                </>
              )}

              {/* Location Info Display */}
              {latitude && longitude && (
                <View
                  style={{
                    backgroundColor: '#0f3f0f',
                    borderWidth: 1,
                    borderColor: '#22c55e',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: '#22c55e',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    ✓ Location Coordinates Captured
                  </Text>
                  <Text
                    style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}
                  >
                    Lat: {latitude.toFixed(6)}, Lon: {longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              {/* City and State row */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                    City {!useAutocomplete && '*'}
                  </Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor="#6b7280"
                    editable={!useAutocomplete}
                    style={{
                      color: 'white',
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: useAutocomplete ? '#0f0f0f' : '#16171a',
                      opacity: useAutocomplete ? 0.7 : 1,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                    State {!useAutocomplete && '*'}
                  </Text>
                  <TextInput
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                    placeholderTextColor="#6b7280"
                    editable={!useAutocomplete}
                    style={{
                      color: 'white',
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: useAutocomplete ? '#0f0f0f' : '#16171a',
                      opacity: useAutocomplete ? 0.7 : 1,
                    }}
                  />
                </View>
              </View>

              {/* Zip Code and Phone row */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                    Zip Code
                  </Text>
                  <TextInput
                    value={zipCode}
                    onChangeText={setZipCode}
                    placeholder="Zip code"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    editable={!useAutocomplete}
                    style={{
                      color: 'white',
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: useAutocomplete ? '#0f0f0f' : '#16171a',
                      opacity: useAutocomplete ? 0.7 : 1,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                    Phone Number
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone number"
                    placeholderTextColor="#6b7280"
                    keyboardType="phone-pad"
                    style={{
                      color: 'white',
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: '#16171a',
                    }}
                  />
                </View>
              </View>

              {/* Table Management Section */}
              <VenueTableManager tables={tables} onTablesChange={setTables} />
            </ScrollView>

            {/* Buttons row */}
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                onPress={submit}
                disabled={loading}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center',
                  marginRight: 8,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#000', fontWeight: '800' }}>
                  {loading
                    ? editingVenue
                      ? 'Updating...'
                      : 'Creating...'
                    : editingVenue
                    ? 'Update Venue'
                    : 'Create Venue'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#b91c1c',
                  borderWidth: 1,
                  borderColor: '#7a1f1f',
                  alignItems: 'center',
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ModalCreateVenueEnhanced;
