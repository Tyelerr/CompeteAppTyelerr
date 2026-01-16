/**
 * Admin Tournaments Management Screen - Role Only View
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
import UIPanel from '../../components/UI/UIPanel';
import { useEffect, useState } from 'react';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { ITournament } from '../../hooks/InterfacesGlobal';
import {
  FetchTournaments2,
  DeleteTournament,
} from '../../ApiSupabase/CrudTournament';
import { supabase } from '../../ApiSupabase/supabase';
import { useContextAuth } from '../../context/ContextAuth';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import ModalAdminTournamentEditor from './ModalAdminTournamentEditor';
import { toTitleCase } from '../../utils/StringHelpers';

interface TournamentWithDetails extends ITournament {
  likes_count?: number;
}

/* ---------- Badge Components ---------- */
function GameTypeBadge({ gameType }: { gameType: string }) {
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
        {gameType}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const getStatusColor = (status?: string) => {
    if (!status) return '#6b7280'; // gray for unknown
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('approved') || lowerStatus.includes('active'))
      return '#10b981'; // green
    if (lowerStatus.includes('pending')) return '#f59e0b'; // yellow
    if (lowerStatus.includes('rejected') || lowerStatus.includes('cancelled'))
      return '#ef4444'; // red
    return '#6b7280'; // gray default
  };

  const color = getStatusColor(status);
  const displayStatus = status || 'Unknown';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color + '66',
        backgroundColor: color + '22',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color, fontWeight: '700', fontSize: 12 }}>
        {displayStatus}
      </Text>
    </View>
  );
}

function VenueBadge({
  venueId,
  venueName,
}: {
  venueId?: number;
  venueName?: string;
}) {
  if (venueId) {
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
        <Text
          style={{
            color: '#7c3aed',
            fontWeight: '700',
            fontSize: 12,
          }}
        >
          Venue ID: {venueId}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: '#ef444466',
        backgroundColor: '#ef444422',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          color: '#ef4444',
          fontWeight: '700',
          fontSize: 12,
        }}
      >
        No venue assigned
      </Text>
    </View>
  );
}

function EntryFeeBadge({ fee }: { fee?: string | number }) {
  if (!fee) return null;

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
      <Text
        style={{
          color: '#10b981',
          fontWeight: '700',
          fontSize: 12,
        }}
      >
        ${fee}
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

export default function ScreenAdminTournaments() {
  const [tournaments, setTournaments] = useState<TournamentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTournaments, setFilteredTournaments] = useState<
    TournamentWithDetails[]
  >([]);
  const [selectedTournament, setSelectedTournament] = useState<
    TournamentWithDetails | undefined
  >(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useContextAuth();

  const loadTournaments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await FetchTournaments2(0, 50); // Get first 50 tournaments

      if (error) {
        console.error('Error loading tournaments:', error);
        if (!isRefresh) {
          Alert.alert('Error', 'Failed to load tournaments');
        }
        return;
      }

      if (data) {
        setTournaments(data);
        setFilteredTournaments(data);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load tournaments');
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
    loadTournaments(true);
  };

  const deleteTournamentWithLikes = async (
    tournamentId: string,
    tournamentIdUnique: number,
  ) => {
    try {
      console.log(
        '🗑️ Deleting tournament with archival from main admin screen:',
        tournamentIdUnique,
      );

      // Use the proper DeleteTournament function which archives the tournament
      const result = await DeleteTournament(
        tournamentId,
        user?.id,
        'admin_deletion',
      );

      if (result.success) {
        console.log('✅ Tournament deleted and archived successfully');
        return { success: true };
      } else {
        console.error(
          '❌ Error deleting tournament with archival:',
          result.error,
        );
        console.log('Falling back to direct database deletion');

        // Fallback to original deletion method if archival fails
        // Try to delete from tournament_likes_history table with proper error handling
        try {
          const { error: likesError } = await supabase
            .from('tournament_likes_history')
            .delete()
            .eq('tournament_id_unique_number', tournamentIdUnique);

          if (likesError && likesError.code !== '42703') {
            // Only log if it's not a "column does not exist" error
            console.error('Error deleting tournament likes:', likesError);
          }
        } catch (likesDeleteError) {
          // Silently continue if the table/column doesn't exist
          console.log(
            'Tournament likes history table may not exist or have different schema',
          );
        }

        // Try alternative column names for tournament_likes_history
        try {
          const { error: altLikesError } = await supabase
            .from('tournament_likes_history')
            .delete()
            .eq('tournament_id', tournamentId);

          if (altLikesError && altLikesError.code !== '42703') {
            console.error(
              'Error deleting tournament likes (alt method):',
              altLikesError,
            );
          }
        } catch (altLikesDeleteError) {
          // Silently continue
        }

        // Also delete from the old likes table if it exists
        try {
          const { error: oldLikesError } = await supabase
            .from('likes')
            .delete()
            .eq('turnament_id', tournamentId);

          if (oldLikesError && oldLikesError.code !== '42703') {
            console.error(
              'Error deleting old tournament likes:',
              oldLikesError,
            );
          }
        } catch (oldLikesDeleteError) {
          // Silently continue if the table doesn't exist
        }

        // Finally, delete the tournament
        const { error: tournamentError } = await supabase
          .from('tournaments')
          .delete()
          .eq('id', tournamentId);

        if (tournamentError) {
          console.error('Error deleting tournament:', tournamentError);
          throw new Error('Failed to delete tournament');
        }

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Exception in deleteTournamentWithLikes:', error);
      return { success: false, error };
    }
  };

  const handleDeleteTournament = async (tournament: TournamentWithDetails) => {
    Alert.alert(
      'Delete Tournament',
      `Are you sure you want to delete "${tournament.tournament_name}"? This will also delete all associated likes and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteTournamentWithLikes(
                tournament.id!,
                tournament.id_unique_number,
              );

              if (result.success) {
                Alert.alert(
                  'Success',
                  'Tournament and all associated data deleted successfully',
                );
                loadTournaments(); // Reload the list
              } else {
                Alert.alert('Error', 'Failed to delete tournament');
              }
            } catch (error) {
              console.error('Error deleting tournament:', error);
              Alert.alert('Error', 'Failed to delete tournament');
            }
          },
        },
      ],
    );
  };

  const handleEditTournament = (tournament: TournamentWithDetails) => {
    setSelectedTournament(tournament);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTournament(undefined);
  };

  const handleTournamentUpdated = () => {
    loadTournaments();
  };

  const handleTournamentDeleted = () => {
    if (selectedTournament) {
      handleDeleteTournament(selectedTournament);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTournaments(tournaments);
    } else {
      const filtered = tournaments.filter(
        (tournament) =>
          tournament.tournament_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          tournament.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tournament.director_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          tournament.game_type
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          tournament.id_unique_number.toString().includes(searchTerm),
      );
      setFilteredTournaments(filtered);
    }
  }, [searchTerm, tournaments]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderTournamentItem = ({ item }: { item: TournamentWithDetails }) => (
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
      {/* Header - Role Only View - Exact match to users screen */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Tournament info - non-clickable */}
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
              🏆
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ color: 'white', fontSize: 16, fontWeight: '800' }}
              numberOfLines={1}
            >
              {item.tournament_name}
            </Text>

            {/* Role-only badges - two rows layout */}
            <View style={{ marginTop: 6 }}>
              {/* First row: Game Type and Venue ID */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <GameTypeBadge gameType={item.game_type || 'Unknown'} />
                <View style={{ width: 8 }} />
                <VenueBadge venueId={item.venue_id} venueName={item.venue} />
              </View>

              {/* Second row: Tournament ID and Date */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <Badge
                  text={`${item.id_unique_number}`}
                  prefix="Tournament ID:"
                />
                <View style={{ width: 8 }} />
                <Badge text={formatDate(item.start_date)} />
              </View>
            </View>
          </View>
        </View>

        {/* Right-side action buttons - minimal like users screen */}
        <View style={{ flexDirection: 'row', marginLeft: 8 }}>
          <TouchableOpacity
            onPress={() => handleEditTournament(item)}
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
            onPress={() => handleDeleteTournament(item)}
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
    <>
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
            placeholder="Search tournaments..."
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
            {filteredTournaments.length} tournament
            {filteredTournaments.length !== 1 ? 's' : ''} found
          </Text>

          {/* Tournament Management Title */}
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '800',
              marginTop: BasePaddingsMargins.m10,
              marginBottom: BasePaddingsMargins.m10,
            }}
          >
            Tournament Management
          </Text>

          <View style={{ maxWidth: '100%' }}>
            {filteredTournaments.map((item) => (
              <View
                key={item.id!.toString()}
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
                {/* Header - Role Only View - Exact match to users screen */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Tournament info - non-clickable */}
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
                      <Text
                        style={{
                          color: 'white',
                          fontWeight: '800',
                          fontSize: 16,
                        }}
                      >
                        🏆
                      </Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: '800',
                        }}
                        numberOfLines={1}
                      >
                        {toTitleCase(item.tournament_name)}
                      </Text>

                      {/* Role-only badges - two rows layout */}
                      <View style={{ marginTop: 6 }}>
                        {/* First row: Game Type and Venue ID */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <GameTypeBadge
                            gameType={item.game_type || 'Unknown'}
                          />
                          <View style={{ width: 8 }} />
                          <VenueBadge
                            venueId={item.venue_id}
                            venueName={item.venue}
                          />
                        </View>

                        {/* Second row: Tournament ID and Date */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 6,
                          }}
                        >
                          <Badge
                            text={`${item.id_unique_number}`}
                            prefix="Tournament ID:"
                          />
                          <View style={{ width: 8 }} />
                          <Badge text={formatDate(item.start_date)} />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Right-side action buttons - minimal like users screen */}
                  <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleEditTournament(item)}
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
                      onPress={() => handleDeleteTournament(item)}
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
            ))}
            {!loading && filteredTournaments.length === 0 ? (
              <Text
                style={{ color: '#9ca3af', textAlign: 'center', marginTop: 20 }}
              >
                No tournaments found.
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
      </ScreenScrollView>

      {/* Tournament Editor Modal */}
      <ModalAdminTournamentEditor
        tournament={selectedTournament}
        isOpened={isModalOpen}
        F_isOpened={handleModalClose}
        onTournamentUpdated={handleTournamentUpdated}
        onTournamentDeleted={handleTournamentDeleted}
      />
    </>
  );
}
