import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { fetchVenues } from '../../ApiSupabase/CrudVenues';
import { IVenue } from '../../hooks/InterfacesGlobal';
import GoogleSearchVenue from '../../components/google/GoogleSearchVenue';

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

interface ModalSearchVenueProps {
  visible: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onCreateNewWithData?: (venueData: GoogleVenueData) => void;
  onSelectVenue?: (venue: IVenue) => void;
}

const ModalSearchVenue: React.FC<ModalSearchVenueProps> = ({
  visible,
  onClose,
  onCreateNew,
  onCreateNewWithData,
  onSelectVenue,
}) => {
  const [search, setSearch] = useState('');
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningVenue, setAssigningVenue] = useState<number | null>(null);
  const [selectedGoogleVenue, setSelectedGoogleVenue] =
    useState<GoogleVenueData | null>(null);

  useEffect(() => {
    if (visible) {
      loadVenues();
      setSelectedGoogleVenue(null);
      setSelectedVenueName('');
      setSelectedVenueAddress('');
      setAssigningVenue(null); // Reset assignment state when modal opens
    } else {
      setAssigningVenue(null); // Reset assignment state when modal closes
    }
  }, [visible, search]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const data = await fetchVenues(search);
      setVenues(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  // Parse Google formatted address to extract city, state, zip
  const parseGoogleAddress = (formattedAddress: string) => {
    const parts = formattedAddress.split(', ');
    let city = '';
    let state = '';
    let zipCode = '';

    if (parts.length >= 3) {
      city = parts[parts.length - 3] || '';
      const stateZip = parts[parts.length - 2] || '';
      const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (stateZipMatch) {
        state = stateZipMatch[1];
        zipCode = stateZipMatch[2];
      }
    }

    return { city, state, zipCode };
  };

  const handleGoogleVenueSelected = (
    venueName: string,
    address: string,
    latitude?: number,
    longitude?: number,
  ) => {
    const { city, state, zipCode } = parseGoogleAddress(address);
    const googleVenueData: GoogleVenueData = {
      name: venueName,
      address: address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
    };
    setSelectedGoogleVenue(googleVenueData);
  };

  // Store the venue name, address, and coordinates separately when they're selected
  const [selectedVenueName, setSelectedVenueName] = useState<string>('');
  const [selectedVenueAddress, setSelectedVenueAddress] = useState<string>('');
  const [selectedVenueLatitude, setSelectedVenueLatitude] = useState<
    number | undefined
  >(undefined);
  const [selectedVenueLongitude, setSelectedVenueLongitude] = useState<
    number | undefined
  >(undefined);

  // When both name and address are available, create the Google venue data
  useEffect(() => {
    if (selectedVenueName && selectedVenueAddress) {
      handleGoogleVenueSelected(
        selectedVenueName,
        selectedVenueAddress,
        selectedVenueLatitude,
        selectedVenueLongitude,
      );
    }
  }, [
    selectedVenueName,
    selectedVenueAddress,
    selectedVenueLatitude,
    selectedVenueLongitude,
  ]);

  const handleCreateWithGoogleData = () => {
    if (selectedGoogleVenue && onCreateNewWithData) {
      onCreateNewWithData(selectedGoogleVenue);
    } else {
      onCreateNew();
    }
  };

  const renderVenue = ({ item }: { item: IVenue }) => (
    <TouchableOpacity
      onPress={() => {
        if (onSelectVenue) {
          onSelectVenue(item);
        }
      }}
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: BaseColors.PanelBorderColor,
        backgroundColor: '#16171a',
        marginBottom: 8,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700' }}>{item.venue}</Text>
      <Text style={{ color: '#9ca3af' }}>{item.address}</Text>
      {item.phone && <Text style={{ color: '#9ca3af' }}>{item.phone}</Text>}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
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
            maxHeight: '80%',
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
            Search Venues
          </Text>

          {/* Google Places Search */}
          <Text style={{ color: '#9ca3af', marginBottom: 8, fontSize: 14 }}>
            Search Google Places:
          </Text>
          <GoogleSearchVenue
            setVenueOut={(venueName: string) => {
              // Store the venue name when it's received
              setSelectedVenueName(venueName);
            }}
            setAddressOut={(address: string) => {
              // Store the address when it's received
              setSelectedVenueAddress(address);
            }}
            setLatOut={(latitude: string) => {
              // Store the latitude when it's received
              setSelectedVenueLatitude(parseFloat(latitude));
            }}
            setLngOut={(longitude: string) => {
              // Store the longitude when it's received
              setSelectedVenueLongitude(parseFloat(longitude));
            }}
            placeholder="Search for venues on Google..."
            marginBottom={16}
          />

          {/* Show selected Google venue */}
          {selectedGoogleVenue && (
            <View
              style={{
                backgroundColor: '#0f3460',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#3b82f6',
              }}
            >
              <Text
                style={{ color: '#3b82f6', fontWeight: '700', marginBottom: 4 }}
              >
                Selected from Google:
              </Text>
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {selectedGoogleVenue.name}
              </Text>
              <Text style={{ color: '#9ca3af' }}>
                {selectedGoogleVenue.address}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: BaseColors.PanelBorderColor,
              marginVertical: 16,
            }}
          />

          {/* Local venues search */}
          <Text style={{ color: '#9ca3af', marginBottom: 8, fontSize: 14 }}>
            Existing venues:
          </Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search existing venues..."
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

          <ScrollView style={{ maxHeight: 200 }}>
            {venues.length > 0 ? (
              venues.map((item) => {
                const isAssigning = assigningVenue === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      if (onSelectVenue && !isAssigning) {
                        setAssigningVenue(item.id);
                        onSelectVenue(item);
                      }
                    }}
                    disabled={isAssigning}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: BaseColors.PanelBorderColor,
                      backgroundColor: isAssigning ? '#1e3a8a' : '#16171a',
                      marginBottom: 8,
                      borderRadius: 8,
                      opacity: isAssigning ? 0.7 : 1,
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>
                          {item.venue}
                        </Text>
                        <Text style={{ color: '#9ca3af' }}>{item.address}</Text>
                        {item.phone && (
                          <Text style={{ color: '#9ca3af' }}>{item.phone}</Text>
                        )}
                      </View>
                      {isAssigning && (
                        <View style={{ marginLeft: 8 }}>
                          <Text
                            style={{
                              color: '#3b82f6',
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                          >
                            Assigning...
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : !loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  No existing venues found.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Buttons row */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleCreateWithGoogleData}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: selectedGoogleVenue ? '#10b981' : '#3b82f6',
                alignItems: 'center',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#000', fontWeight: '800' }}>
                {selectedGoogleVenue
                  ? 'Create from Google'
                  : 'Create New Venue'}
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
              <Text style={{ color: 'white', fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ModalSearchVenue;
