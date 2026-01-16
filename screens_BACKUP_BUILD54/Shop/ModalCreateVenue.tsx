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
import { createVenue, updateVenue } from '../../ApiSupabase/CrudVenues';
import { IVenue, IVenueTable } from '../../hooks/InterfacesGlobal';
import VenueTableManager from '../../components/VenueTableManagerNew';

interface GoogleVenueData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

interface ModalCreateVenueProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (venue: IVenue) => void;
  prefilledData?: GoogleVenueData;
  barownerId?: number; // Changed to number to match database INT type
  editingVenue?: IVenue; // Add editing venue prop
}

const ModalCreateVenue: React.FC<ModalCreateVenueProps> = ({
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
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<
    Omit<IVenueTable, 'id' | 'venue_id' | 'created_at' | 'updated_at'>[]
  >([]);

  // Pre-fill form when prefilledData or editingVenue is provided
  useEffect(() => {
    if (editingVenue) {
      // Pre-fill with editing venue data
      setName(editingVenue.venue || '');
      setAddress(editingVenue.address || '');
      setCity(editingVenue.city || ''); // Pull city from venue data
      setState(editingVenue.state || ''); // Pull state from venue data
      setZipCode(editingVenue.zip_code || ''); // Pull zip_code from venue data
      setPhone(editingVenue.phone || '');
      // Convert existing tables to the format expected by VenueTableManager
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
      setTables([]);
    } else if (visible) {
      // Reset form when opening without prefilled data
      setName('');
      setAddress('');
      setCity('');
      setState('');
      setZipCode('');
      setPhone('');
      setTables([]);
    }
  }, [prefilledData, editingVenue, visible]);

  const submit = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Validation Error', 'Name and address are required.');
      return;
    }
    setLoading(true);
    try {
      let venue;
      if (editingVenue) {
        // Update existing venue - include city, state, and zip code
        venue = await updateVenue(editingVenue.id, {
          venue: name.trim(),
          address: address.trim(),
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          zip_code: zipCode.trim() || undefined,
          phone: phone.trim() || undefined,
          tables: tables.length > 0 ? tables : undefined,
        });
      } else {
        // Create new venue
        venue = await createVenue({
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip_code: zipCode.trim() || undefined,
          phone: phone.trim() || undefined,
          barowner_id: barownerId, // Pass the barowner_id
          latitude: prefilledData?.latitude || null, // Include latitude from Google
          longitude: prefilledData?.longitude || null, // Include longitude from Google
          tables: tables.length > 0 ? tables : undefined, // Include tables if any
        });
      }

      if (venue) {
        onCreated(venue);
        setName('');
        setAddress('');
        setCity('');
        setState('');
        setZipCode('');
        setPhone('');
        setTables([]);
      } else {
        Alert.alert(
          'Error',
          `Failed to ${editingVenue ? 'update' : 'create'} venue.`,
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to ${
          editingVenue ? 'update' : 'create'
        } venue. Please try again.`,
      );
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
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                Venue Name
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

              <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Address</Text>
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

              {/* City and State row */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                    City
                  </Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor="#6b7280"
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
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                    State
                  </Text>
                  <TextInput
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                    placeholderTextColor="#6b7280"
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

export default ModalCreateVenue;
