import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { fetchVenues, IVenue } from '../../ApiSupabase/CrudVenues';

interface ModalSelectVenueForTDProps {
  visible: boolean;
  onClose: () => void;
  onSelectVenue: (venue: IVenue) => void;
  userName: string;
}

const ModalSelectVenueForTD: React.FC<ModalSelectVenueForTDProps> = ({
  visible,
  onClose,
  onSelectVenue,
  userName,
}) => {
  const [search, setSearch] = useState('');
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVenues();
      setSearch('');
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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-start',
          paddingTop: '55%',
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
            maxHeight: '70%',
            width: '100%',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: '800',
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            Select Venue for Tournament Director
          </Text>

          <Text
            style={{
              color: '#9ca3af',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Assign {userName} as Tournament Director to a venue
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search venues..."
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

          <ScrollView style={{ maxHeight: 300 }}>
            {venues.length > 0 ? (
              venues.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectVenue(item)}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: BaseColors.PanelBorderColor,
                    backgroundColor: '#16171a',
                    marginBottom: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>
                    {item.venue}
                  </Text>
                  <Text style={{ color: '#9ca3af' }}>{item.address}</Text>
                  {item.phone && (
                    <Text style={{ color: '#9ca3af' }}>{item.phone}</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : !loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  {search.trim()
                    ? 'No venues found matching your search.'
                    : 'No venues available.'}
                </Text>
              </View>
            ) : null}

            {loading && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  Loading venues...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Cancel button */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
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

export default ModalSelectVenueForTD;
