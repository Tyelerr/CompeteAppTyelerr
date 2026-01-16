import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  geocodeAllVenues,
  getGeocodingStats,
  fetchVenuesNeedingGeocoding,
  geocodeAndUpdateVenue,
} from '../../ApiSupabase/GeocodeVenues';
import { updateVenue } from '../../ApiSupabase/CrudVenues';

interface VenueCoordinateManagerProps {
  onUpdate?: () => void;
}

interface VenueStats {
  total_venues: number;
  venues_with_coordinates: number;
  venues_needing_coordinates: number;
  completion_percentage: number;
}

interface Venue {
  id: number;
  venue: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

const VenueCoordinateManager: React.FC<VenueCoordinateManagerProps> = ({
  onUpdate,
}) => {
  const [stats, setStats] = useState<VenueStats | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [editingVenue, setEditingVenue] = useState<number | null>(null);
  const [manualCoords, setManualCoords] = useState({
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, allVenuesData] = await Promise.all([
        getGeocodingStats(),
        fetchVenuesNeedingGeocoding(), // Get all venues needing coordinates
      ]);

      // Limit to first 10 venues for display
      const venuesData = allVenuesData.slice(0, 10);

      setStats(statsData);
      setVenues(venuesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load venue data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoGeocodeAll = async () => {
    Alert.alert(
      'Automatic Geocoding',
      `This will automatically add coordinates to ${
        stats?.venues_needing_coordinates || 0
      } venues using their addresses. This may take a few minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Geocoding',
          onPress: async () => {
            setIsGeocoding(true);
            try {
              const results = await geocodeAllVenues();
              Alert.alert(
                'Geocoding Complete!',
                `✅ Successfully geocoded: ${results.successful} venues\n` +
                  `❌ Failed to geocode: ${results.failed} venues\n` +
                  `📍 Total processed: ${results.total} venues`,
              );
              await loadData(); // Refresh data
              onUpdate?.();
            } catch (error) {
              Alert.alert('Error', 'Geocoding failed. Please try again.');
            } finally {
              setIsGeocoding(false);
            }
          },
        },
      ],
    );
  };

  const handleAutoGeocodeOne = async (venue: Venue) => {
    setIsLoading(true);
    try {
      const success = await geocodeAndUpdateVenue(venue);
      if (success) {
        Alert.alert('Success', `Coordinates updated for ${venue.venue}`);
        await loadData(); // Refresh data
        onUpdate?.();
      } else {
        Alert.alert(
          'Failed',
          `Could not geocode ${venue.venue}. Try manual entry.`,
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to geocode venue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualUpdate = async (venue: Venue) => {
    const latitude = parseFloat(manualCoords.latitude);
    const longitude = parseFloat(manualCoords.longitude);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      Alert.alert(
        'Invalid Input',
        'Please enter valid latitude and longitude values',
      );
      return;
    }

    if (latitude < -90 || latitude > 90) {
      Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90');
      return;
    }

    if (longitude < -180 || longitude > 180) {
      Alert.alert(
        'Invalid Longitude',
        'Longitude must be between -180 and 180',
      );
      return;
    }

    setIsLoading(true);
    try {
      await updateVenue(venue.id, { latitude, longitude });
      Alert.alert('Success', `Manual coordinates saved for ${venue.venue}`);
      setEditingVenue(null);
      setManualCoords({ latitude: '', longitude: '' });
      await loadData(); // Refresh data
      onUpdate?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to update coordinates');
    } finally {
      setIsLoading(false);
    }
  };

  const startManualEdit = (venue: Venue) => {
    setEditingVenue(venue.id);
    setManualCoords({
      latitude: venue.latitude?.toString() || '',
      longitude: venue.longitude?.toString() || '',
    });
  };

  const cancelManualEdit = () => {
    setEditingVenue(null);
    setManualCoords({ latitude: '', longitude: '' });
  };

  if (isLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading venue data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Venue Coordinates Manager</Text>

        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              📊 {stats.venues_with_coordinates} of {stats.total_venues} venues
              have coordinates
            </Text>
            <Text style={styles.statsText}>
              📈 {stats.completion_percentage}% complete
            </Text>
            {stats.venues_needing_coordinates > 0 && (
              <Text style={styles.statsText}>
                ❓ {stats.venues_needing_coordinates} venues need coordinates
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Auto Geocoding Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 Automatic Geocoding</Text>
        <Text style={styles.sectionDescription}>
          Automatically add coordinates using venue addresses
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            isGeocoding && styles.disabledButton,
          ]}
          onPress={handleAutoGeocodeAll}
          disabled={
            isGeocoding || (stats?.venues_needing_coordinates || 0) === 0
          }
        >
          {isGeocoding ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {stats?.venues_needing_coordinates === 0
                ? '✅ All Venues Have Coordinates'
                : `🌍 Geocode All ${stats?.venues_needing_coordinates} Venues`}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Manual Entry Section */}
      {venues.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ Manual Coordinate Entry</Text>
          <Text style={styles.sectionDescription}>
            Add or edit coordinates manually for individual venues
          </Text>

          {venues.map((venue) => (
            <View key={venue.id} style={styles.venueCard}>
              <View style={styles.venueHeader}>
                <Text style={styles.venueName}>{venue.venue}</Text>
                <Text style={styles.venueAddress}>{venue.address}</Text>
                {venue.latitude && venue.longitude && (
                  <Text style={styles.currentCoords}>
                    📍 Current: {venue.latitude.toFixed(6)},{' '}
                    {venue.longitude.toFixed(6)}
                  </Text>
                )}
              </View>

              {editingVenue === venue.id ? (
                // Manual input form
                <View style={styles.inputForm}>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Latitude (-90 to 90)
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={manualCoords.latitude}
                        onChangeText={(text) =>
                          setManualCoords((prev) => ({
                            ...prev,
                            latitude: text,
                          }))
                        }
                        placeholder="e.g., 40.7128"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Longitude (-180 to 180)
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={manualCoords.longitude}
                        onChangeText={(text) =>
                          setManualCoords((prev) => ({
                            ...prev,
                            longitude: text,
                          }))
                        }
                        placeholder="e.g., -74.0060"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.successButton]}
                      onPress={() => handleManualUpdate(venue)}
                      disabled={isLoading}
                    >
                      <Text style={styles.buttonText}>💾 Save Coordinates</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={cancelManualEdit}
                    >
                      <Text style={styles.buttonText}>❌ Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Action buttons
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => handleAutoGeocodeOne(venue)}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonText}>🌍 Auto Geocode</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.tertiaryButton]}
                    onPress={() => startManualEdit(venue)}
                  >
                    <Text style={styles.buttonText}>✏️ Manual Entry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {venues.length === 10 && (
            <Text style={styles.moreVenuesText}>
              Showing first 10 venues. More will appear as these are completed.
            </Text>
          )}
        </View>
      )}

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Tips</Text>
        <Text style={styles.helpText}>
          • Automatic geocoding uses venue addresses to find coordinates{'\n'}•
          Manual entry is useful for addresses that can't be automatically
          geocoded{'\n'}• Latitude ranges from -90 (South Pole) to 90 (North
          Pole){'\n'}• Longitude ranges from -180 to 180 (International Date
          Line){'\n'}• Use Google Maps to find precise coordinates if needed
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  statsText: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 5,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 5,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#28a745',
    flex: 1,
    marginRight: 5,
  },
  tertiaryButton: {
    backgroundColor: '#6c757d',
    flex: 1,
    marginLeft: 5,
  },
  successButton: {
    backgroundColor: '#28a745',
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    flex: 1,
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  venueCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  venueHeader: {
    marginBottom: 10,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  venueAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  currentCoords: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 5,
  },
  inputForm: {
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  moreVenuesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default VenueCoordinateManager;
