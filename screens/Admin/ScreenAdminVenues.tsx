/**
 * Admin Venues Management Screen
 */

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import ScreenScrollView from '../ScreenScrollView';
import ScreenAdminDropdownNavigation from './ScreenAdminDropdownNavigation';
import { useEffect, useState } from 'react';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { IVenue } from '../../hooks/InterfacesGlobal';
import { fetchVenues } from '../../ApiSupabase/CrudVenues';
import { supabase } from '../../ApiSupabase/supabase';
import LFInput from '../../components/LoginForms/LFInput';
import ModalCreateVenue from '../Shop/ModalCreateVenue';
const ModalAssignTournamentDirector =
  require('../Shop/ModalAssignTournamentDirector').default;

interface VenueWithTournaments extends IVenue {
  tournament_count?: number;
}

/* ---------- Badge Components ---------- */
function VenueIdBadge({ venueId }: { venueId: number }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BaseColors.PanelBorderColor,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#1b1c20',
      }}
    >
      <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 12 }}>
        ID: {venueId}
      </Text>
    </View>
  );
}

function AddressBadge({ address }: { address: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#10b98166',
        backgroundColor: '#10b98122',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 12 }}>
        📍 {address}
      </Text>
    </View>
  );
}

function CityStateBadge({ city, state }: { city?: string; state?: string }) {
  if (!city && !state) return null;

  const displayText = city && state ? `${city}, ${state}` : city || state || '';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#3b82f666',
        backgroundColor: '#3b82f622',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: '#3b82f6', fontWeight: '700', fontSize: 12 }}>
        🏙️ {displayText}
      </Text>
    </View>
  );
}

function PhoneBadge({ phone }: { phone: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#7c3aed66',
        backgroundColor: '#7c3aed22',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 12 }}>
        📞 {phone}
      </Text>
    </View>
  );
}

function Badge({ text, prefix }: { text: string; prefix?: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BaseColors.PanelBorderColor,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#1b1c20',
      }}
    >
      <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 12 }}>
        {prefix ? `${prefix} ` : ''}
        {text}
      </Text>
    </View>
  );
}

export default function ScreenAdminVenues() {
  const [venues, setVenues] = useState<VenueWithTournaments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVenues, setFilteredVenues] = useState<VenueWithTournaments[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueWithTournaments | null>(
    null,
  );

  // Tournament Director assignment modal state
  const [tdModalVisible, setTdModalVisible] = useState(false);
  const [selectedVenueForTD, setSelectedVenueForTD] =
    useState<VenueWithTournaments | null>(null);

  const loadVenues = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchVenues();

      if (data) {
        setVenues(data);
        setFilteredVenues(data);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load venues');
      }
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

  const deleteVenueWithTournaments = async (venueId: number) => {
    try {
      // First, get all tournaments for this venue
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id_unique_number')
        .eq('venue_id', venueId);

      if (tournamentsError) {
        console.error(
          'Error fetching tournaments for venue:',
          tournamentsError,
        );
        throw new Error('Failed to fetch tournaments for venue');
      }

      // Delete all tournament likes for tournaments at this venue
      if (tournaments && tournaments.length > 0) {
        const tournamentIds = tournaments.map((t) => t.id_unique_number);

        const { error: likesError } = await supabase
          .from('tournament_likes_history')
          .delete()
          .in('tournament_id_unique_number', tournamentIds);

        if (likesError) {
          console.error('Error deleting tournament likes:', likesError);
          // Continue anyway, as this is not critical
        }

        // Delete all tournaments at this venue
        const { error: tournamentsDeleteError } = await supabase
          .from('tournaments')
          .delete()
          .eq('venue_id', venueId);

        if (tournamentsDeleteError) {
          console.error('Error deleting tournaments:', tournamentsDeleteError);
          throw new Error('Failed to delete tournaments');
        }
      }

      // Delete venue tables
      const { error: tablesError } = await supabase
        .from('venue_tables')
        .delete()
        .eq('venue_id', venueId);

      if (tablesError) {
        console.error('Error deleting venue tables:', tablesError);
        // Continue anyway, as this is not critical
      }

      // Finally, delete the venue
      const { error: venueError } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (venueError) {
        console.error('Error deleting venue:', venueError);
        throw new Error('Failed to delete venue');
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteVenueWithTournaments:', error);
      return { success: false, error };
    }
  };

  const handleDeleteVenue = async (venue: VenueWithTournaments) => {
    Alert.alert(
      'Delete Venue',
      `Are you sure you want to delete "${venue.venue}"? This will also delete all associated tournaments and their likes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteVenueWithTournaments(venue.id);

              if (result.success) {
                Alert.alert(
                  'Success',
                  'Venue and all associated data deleted successfully',
                );
                loadVenues(); // Reload the list
              } else {
                Alert.alert('Error', 'Failed to delete venue');
              }
            } catch (error) {
              console.error('Error deleting venue:', error);
              Alert.alert('Error', 'Failed to delete venue');
            }
          },
        },
      ],
    );
  };

  const handleEditVenue = (venue: VenueWithTournaments) => {
    setEditingVenue(venue);
    setEditModalVisible(true);
  };

  const handleVenueUpdated = (updatedVenue: IVenue) => {
    // Close the modal
    setEditModalVisible(false);
    setEditingVenue(null);

    // Show success message
    Alert.alert('Success', 'Venue updated successfully!');

    // Refresh the venues list to show updated data
    loadVenues();
  };

  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setEditingVenue(null);
  };

  // Tournament Director assignment handlers
  const handleAssignTournamentDirector = (venue: VenueWithTournaments) => {
    setSelectedVenueForTD(venue);
    setTdModalVisible(true);
  };

  const handleTdModalClose = () => {
    setTdModalVisible(false);
    setSelectedVenueForTD(null);
  };

  const handleTdAssigned = () => {
    // Refresh venues list to show any updates
    loadVenues();
    // Close modal
    handleTdModalClose();
  };

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVenues(venues);
    } else {
      const filtered = venues.filter(
        (venue) =>
          venue.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venue.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venue.city?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredVenues(filtered);
    }
  }, [searchTerm, venues]);

  const renderVenueItem = ({ item }: { item: VenueWithTournaments }) => (
    <View
      style={{
        backgroundColor: '#161618',
        borderColor: BaseColors.PanelBorderColor,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: BasePaddingsMargins.m15,
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      {/* Header - Role Only View - Exact match to tournaments/users screen */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Venue info - non-clickable */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#222228',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              marginRight: 12,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
              🏢
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ color: 'white', fontSize: 16, fontWeight: '800' }}
              numberOfLines={1}
            >
              {item.venue}
            </Text>

            {/* Role-only badges - two rows layout */}
            <View style={{ marginTop: 6 }}>
              {/* First row: Venue ID and City/State */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <VenueIdBadge venueId={item.id} />
                {(item.city || item.state) && (
                  <>
                    <View style={{ width: 8 }} />
                    <CityStateBadge city={item.city} state={item.state} />
                  </>
                )}
              </View>

              {/* Second row: Phone */}
              {item.phone && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 6,
                  }}
                >
                  <PhoneBadge phone={item.phone} />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right-side action buttons - minimal like users screen */}
        <View style={{ flexDirection: 'row', marginLeft: 8 }}>
          <TouchableOpacity
            onPress={() => handleAssignTournamentDirector(item)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginRight: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e3a1e',
              borderWidth: 1,
              borderColor: '#22c55e',
            }}
          >
            <Text style={{ color: '#22c55e', fontSize: 16 }}>👤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleEditVenue(item)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginRight: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1b2130',
              borderWidth: 1,
              borderColor: '#26354f',
            }}
          >
            <Text style={{ color: '#93c5fd', fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteVenue(item)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#221416',
              borderWidth: 1,
              borderColor: '#7a1f1f',
            }}
          >
            <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0ea5e9"
          titleColor="#0ea5e9"
          colors={['#0ea5e9']}
          progressBackgroundColor="#1a1a1a"
        />
      }
    >
      <View style={{ padding: BasePaddingsMargins.m15 }}>
        <ScreenAdminDropdownNavigation />

        {/* Search input */}
        <LFInput
          placeholder="Search venues..."
          label=""
          onChangeText={(t: string) => setSearchTerm(t)}
          marginBottomInit={BasePaddingsMargins.m10}
        />

        <Text
          style={{
            color: BaseColors.othertexts,
            fontSize: 14,
            marginBottom: 15,
          }}
        >
          {filteredVenues.length} venue
          {filteredVenues.length !== 1 ? 's' : ''} found
        </Text>

        {/* Venue Management Title */}
        <Text
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '800',
            marginTop: BasePaddingsMargins.m10,
            marginBottom: BasePaddingsMargins.m10,
          }}
        >
          Venue Management
        </Text>

        <View style={{ maxWidth: '100%' }}>
          {filteredVenues.map((item) => (
            <View key={item.id.toString()}>{renderVenueItem({ item })}</View>
          ))}
          {!loading && filteredVenues.length === 0 ? (
            <Text
              style={{ color: '#9ca3af', textAlign: 'center', marginTop: 20 }}
            >
              {searchTerm
                ? 'No venues found matching your search.'
                : 'No venues found.'}
            </Text>
          ) : null}
          {loading ? (
            <Text
              style={{ color: '#9ca3af', textAlign: 'center', marginTop: 20 }}
            >
              Loading…
            </Text>
          ) : null}
        </View>
      </View>

      {/* Edit Venue Modal */}
      <ModalCreateVenue
        visible={editModalVisible}
        onClose={handleEditModalClose}
        onCreated={handleVenueUpdated}
        editingVenue={editingVenue || undefined}
      />

      {/* Tournament Director Assignment Modal */}
      {selectedVenueForTD && (
        <ModalAssignTournamentDirector
          visible={tdModalVisible}
          onClose={handleTdModalClose}
          onAssigned={handleTdAssigned}
          venueId={selectedVenueForTD.id}
          venueName={selectedVenueForTD.venue}
        />
      )}
    </ScreenScrollView>
  );
}
