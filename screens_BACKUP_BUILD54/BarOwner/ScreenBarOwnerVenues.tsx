import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useContextAuth } from '../../context/ContextAuth';
import { FetchBarOwnerVenues } from '../../ApiSupabase/CrudBarOwner';
import { IVenue, IVenueTable } from '../../hooks/InterfacesGlobal';
import { StyleZ } from '../../assets/css/styles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { updateVenueTables } from '../../ApiSupabase/CrudVenues';
import ModalCreateVenue from '../Shop/ModalCreateVenue';
import ModalSearchVenue from '../Shop/ModalSearchVenue';

export default function ScreenBarOwnerVenues({ navigation }: any) {
  const { user } = useContextAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Venue modal state
  const [showSearchVenueModal, setShowSearchVenueModal] = useState(false);
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [showEditVenueModal, setShowEditVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<IVenue | null>(null);
  const [googleVenueData, setGoogleVenueData] = useState<any>(null);

  // Venue table management state
  const [venueTables, setVenueTables] = useState<{
    [venueId: number]: Omit<
      IVenueTable,
      'id' | 'venue_id' | 'created_at' | 'updated_at'
    >[];
  }>({});
  const [updatingTables, setUpdatingTables] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id_auto) {
      loadVenues();
    }
  }, [user]);

  const loadVenues = async (isRefresh = false) => {
    if (!user?.id_auto) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data, error } = await FetchBarOwnerVenues(user.id_auto);
      if (error) {
        setError('Failed to load venues');
        console.error('Venues error:', error);
      } else {
        setVenues(data || []);
      }
    } catch (err) {
      setError('Failed to load venues');
      console.error('Venues error:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    loadVenues(true);
  };

  // Venue table management functions
  const handleVenueTablesChange = async (
    venueId: number,
    tables: Omit<
      IVenueTable,
      'id' | 'venue_id' | 'created_at' | 'updated_at'
    >[],
  ) => {
    // Update local state immediately for responsive UI
    setVenueTables((prev) => ({
      ...prev,
      [venueId]: tables,
    }));

    // Update tables in the database
    setUpdatingTables(venueId);
    try {
      const success = await updateVenueTables(venueId, tables);
      if (!success) {
        Alert.alert('Error', 'Failed to update venue tables');
        // Revert local state on error
        setVenueTables((prev) => {
          const newState = { ...prev };
          delete newState[venueId];
          return newState;
        });
      }
    } catch (error) {
      console.error('Error updating venue tables:', error);
      Alert.alert('Error', 'Failed to update venue tables');
      // Revert local state on error
      setVenueTables((prev) => {
        const newState = { ...prev };
        delete newState[venueId];
        return newState;
      });
    } finally {
      setUpdatingTables(null);
    }
  };

  // Initialize venue tables from venue data
  const getVenueTables = (venue: any) => {
    // First check if we have local state changes for this venue
    if (venueTables[venue.id]) {
      return venueTables[venue.id];
    }
    // Convert existing tables to the format expected by VenueTableManager
    if (venue.tables && Array.isArray(venue.tables)) {
      return venue.tables.map((table: any) => ({
        table_size: table.table_size,
        table_brand: table.table_brand || 'Diamond', // Default brand if not specified
        count: table.count || 1, // Default count if not specified
      }));
    }
    return [];
  };

  // Get formatted table display text
  const getTableDisplayText = (venue: any) => {
    const tables = getVenueTables(venue);
    if (tables.length === 0) {
      return 'No tables configured';
    }

    // Sort tables by brand first, then by size (ascending)
    const sortedTables = tables.sort((a: any, b: any) => {
      // First sort by brand
      const brandA = (a.table_brand || 'Unknown').toLowerCase();
      const brandB = (b.table_brand || 'Unknown').toLowerCase();
      if (brandA !== brandB) {
        return brandA.localeCompare(brandB);
      }

      // Then sort by size (extract numeric value for proper sorting)
      const getSizeValue = (size: string) => {
        const match = size.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      const sizeA = getSizeValue(a.table_size || '0');
      const sizeB = getSizeValue(b.table_size || '0');
      return sizeA - sizeB;
    });

    return sortedTables
      .map((table: any) => {
        const count = table.count || 1;
        const size = table.table_size || 'Unknown';
        const brand = table.table_brand || 'Unknown';
        return `( ${count} ) ${brand} ${size}'s`;
      })
      .join('\n');
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={BaseColors.primary} />
        <Text style={[StyleZ.p, { color: BaseColors.light, marginTop: 16 }]}>
          Loading venues...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            padding: BasePaddingsMargins.m20,
          },
        ]}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text
          style={[
            StyleZ.h2,
            { color: BaseColors.light, marginTop: 16, textAlign: 'center' },
          ]}
        >
          Error Loading Venues
        </Text>
        <Text
          style={[
            StyleZ.p,
            { color: BaseColors.othertexts, marginTop: 8, textAlign: 'center' },
          ]}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => loadVenues()}
          style={{
            backgroundColor: BaseColors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text style={[StyleZ.p, { color: BaseColors.light }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[BaseColors.primary]}
          tintColor={BaseColors.primary}
        />
      }
    >
      <View style={{ padding: BasePaddingsMargins.m20 }}>
        {/* Header with Back Button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: BasePaddingsMargins.m20,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: BaseColors.dark,
              borderRadius: 8,
              padding: 12,
              marginRight: 16,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: BaseColors.light, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text
            style={[
              StyleZ.h1,
              { color: BaseColors.light, fontSize: 24, flex: 1 },
            ]}
          >
            My Venues ({venues.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowSearchVenueModal(true)}
            style={{
              backgroundColor: BaseColors.primary,
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 6 }}>🏢</Text>
            <Text
              style={[
                StyleZ.p,
                { color: 'white', fontSize: 14, fontWeight: 'bold' },
              ]}
            >
              Add Venue
            </Text>
          </TouchableOpacity>
        </View>

        {/* Venues List */}
        {venues.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 60,
              backgroundColor: BaseColors.dark,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
            }}
          >
            <Text style={{ fontSize: 64, marginBottom: 20 }}>🏢</Text>
            <Text
              style={[StyleZ.h2, { color: BaseColors.light, marginBottom: 12 }]}
            >
              No Venues Assigned
            </Text>
            <Text
              style={[
                StyleZ.p,
                {
                  color: BaseColors.othertexts,
                  textAlign: 'center',
                  paddingHorizontal: 20,
                  lineHeight: 20,
                },
              ]}
            >
              Contact an administrator to get venues assigned to your account,
              or add a new venue using the button above.
            </Text>
          </View>
        ) : (
          venues.map((venue, index) => (
            <View
              key={venue.id}
              style={{
                backgroundColor: BaseColors.dark,
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: BaseColors.secondary,
              }}
            >
              {/* Venue Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#f59e0b',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 20,
                    }}
                  >
                    🏢
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      StyleZ.h2,
                      {
                        color: BaseColors.light,
                        marginBottom: 4,
                        fontSize: 18,
                      },
                    ]}
                  >
                    {venue.venue}
                  </Text>
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.othertexts, fontSize: 14 },
                    ]}
                  >
                    {venue.address}
                  </Text>
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => {
                    setEditingVenue(venue);
                    setShowEditVenueModal(true);
                  }}
                  style={{
                    backgroundColor: '#3b82f6',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Venue Details */}
              <View
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text
                    style={[
                      StyleZ.p,
                      {
                        color: BaseColors.othertexts,
                        width: 80,
                        fontSize: 14,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    ID:
                  </Text>
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.light, fontSize: 14 },
                    ]}
                  >
                    {venue.id}
                  </Text>
                </View>

                {venue.phone && (
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <Text
                      style={[
                        StyleZ.p,
                        {
                          color: BaseColors.othertexts,
                          width: 80,
                          fontSize: 14,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      Phone:
                    </Text>
                    <Text
                      style={[
                        StyleZ.p,
                        { color: BaseColors.light, fontSize: 14 },
                      ]}
                    >
                      {venue.phone}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text
                    style={[
                      StyleZ.p,
                      {
                        color: BaseColors.othertexts,
                        width: 80,
                        fontSize: 14,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    Director:
                  </Text>
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.light, fontSize: 14 },
                    ]}
                  >
                    {venue.td_id
                      ? `Assigned (ID: ${venue.td_id})`
                      : 'Not assigned'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <Text
                    style={[
                      StyleZ.p,
                      {
                        color: BaseColors.othertexts,
                        width: 80,
                        fontSize: 14,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    Tables:
                  </Text>
                  <View style={{ flex: 1 }}>
                    {getVenueTables(venue).length === 0 ? (
                      <Text
                        style={[
                          StyleZ.p,
                          {
                            color: '#9ca3af',
                            fontSize: 14,
                            fontStyle: 'italic',
                          },
                        ]}
                      >
                        No tables configured
                      </Text>
                    ) : (
                      getTableDisplayText(venue)
                        .split('\n')
                        .map((line: string, index: number) => {
                          // Parse the line to extract count and make it blue
                          const match = line.match(/^\(\s*(\d+)\s*\)\s*(.+)$/);
                          if (match) {
                            const count = match[1];
                            const rest = match[2];
                            return (
                              <Text
                                key={index}
                                style={[
                                  StyleZ.p,
                                  {
                                    color: BaseColors.light,
                                    fontSize: 14,
                                    marginBottom:
                                      index <
                                      getTableDisplayText(venue).split('\n')
                                        .length -
                                        1
                                        ? 4
                                        : 0,
                                  },
                                ]}
                              >
                                <Text style={{ color: '#3b82f6' }}>
                                  ( {count} )
                                </Text>{' '}
                                {rest}
                              </Text>
                            );
                          }
                          return (
                            <Text
                              key={index}
                              style={[
                                StyleZ.p,
                                {
                                  color: BaseColors.light,
                                  fontSize: 14,
                                  marginBottom:
                                    index <
                                    getTableDisplayText(venue).split('\n')
                                      .length -
                                      1
                                      ? 4
                                      : 0,
                                },
                              ]}
                            >
                              {line}
                            </Text>
                          );
                        })
                    )}
                    {updatingTables === venue.id && (
                      <Text
                        style={{
                          color: '#3b82f6',
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Updating tables...
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add Venue Modal */}
      <ModalCreateVenue
        visible={showAddVenueModal}
        onClose={() => {
          setShowAddVenueModal(false);
          setGoogleVenueData(null); // Clear Google venue data when closing
        }}
        onCreated={(venue) => {
          console.log('Venue created:', venue);
          setShowAddVenueModal(false);
          setGoogleVenueData(null); // Clear Google venue data after creation
          loadVenues(); // Refresh data after venue creation
        }}
        prefilledData={googleVenueData}
        barownerId={user?.id_auto}
      />

      {/* Edit Venue Modal */}
      <ModalCreateVenue
        visible={showEditVenueModal}
        onClose={() => {
          setShowEditVenueModal(false);
          setEditingVenue(null);
        }}
        onCreated={(venue: any) => {
          console.log('Venue updated:', venue);
          setShowEditVenueModal(false);
          setEditingVenue(null);
          loadVenues(); // Refresh data after venue update
        }}
        editingVenue={editingVenue || undefined}
        barownerId={user?.id_auto}
      />

      {/* Search Venue Modal with Google Places */}
      <ModalSearchVenue
        visible={showSearchVenueModal}
        onClose={() => setShowSearchVenueModal(false)}
        onCreateNew={() => {
          setShowSearchVenueModal(false);
          setShowAddVenueModal(true);
        }}
        onCreateNewWithData={(venueData) => {
          setShowSearchVenueModal(false);
          setGoogleVenueData(venueData); // Store the Google venue data
          setShowAddVenueModal(true);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BaseColors.backgroundColor,
  },
});
