import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ITournament,
  ETournamentStatuses,
  EUserRole,
} from '../../hooks/InterfacesGlobal';
import { useEffect, useRef, useState } from 'react';
import { UpdateTournament } from '../../ApiSupabase/CrudTournament';
import { IAdminTournamentsFilters } from './AdminTournamentsFIlters';
import {
  TIMEOUT_DELAY_WHEN_SEARCH,
  getThurnamentStaticThumb,
  THUMBNAIL_CUSTOM,
  tournament_thumb_8_ball,
} from '../../hooks/constants';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { useContextAuth } from '../../context/ContextAuth';
import { getLocalTimestampWithoutTimezone } from '../../hooks/hooks';
import ScreenBilliardModalTournament from '../Billiard/ScreenBilliardModalTournament';
import { supabase } from '../../ApiSupabase/supabase';
import { StyleZ } from '../../assets/css/styles';
import UIBadge from '../../components/UI/UIBadge';
import { format, parseISO } from 'date-fns';

export default function AdminTournamentsListSimple({
  filters,
}: {
  filters: IAdminTournamentsFilters | null;
}) {
  const { user } = useContextAuth();
  const [tournaments, setTournaments] = useState<ITournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Modal state
  const [modalForTournamentIsOpened, setModalForTournamentIsOpened] =
    useState<boolean>(false);
  const [selectedTournamentForTheModal, setSelectedTournamentForTheModal] =
    useState<ITournament | null>(null);

  const _LoadTournaments = async () => {
    if (filters === null) return;

    setLoading(true);
    setError('');

    try {
      const {
        searchingTerm,
        filterType,
        filterId,
        filter_status,
        sortBy,
        sortTypeIsAsc,
      } = filters;

      console.log('Loading tournaments with filters:', {
        searchingTerm,
        filterType,
        filterId,
        filter_status,
        sortBy,
        sortTypeIsAsc,
      });

      // Simple query without venue joins to avoid foreign key issues
      let query = supabase.from('tournaments').select('*'); // Only select from tournaments table

      // Apply search filter
      if (searchingTerm && searchingTerm !== '') {
        query = query.or(
          `tournament_name.ilike.%${searchingTerm}%,game_type.ilike.%${searchingTerm}%,venue.ilike.%${searchingTerm}%,director_name.ilike.%${searchingTerm}%`,
        );
      }

      // Apply game type filter
      if (filterType && filterType !== '') {
        query = query.eq('game_type', filterType);
      }

      // Apply ID filter
      if (filterId && filterId !== '' && !isNaN(Number(filterId))) {
        query = query.ilike('id_unique_number', `%${filterId}%`);
      }

      // Apply status filter
      if (filter_status) {
        query = query.eq('status', filter_status);
      }

      // Apply sorting
      const sortColumn = sortBy || 'id_unique_number';
      const sortAscending = sortTypeIsAsc || false;
      query = query.order(sortColumn, { ascending: sortAscending });

      // Limit results
      query = query.limit(50);

      const { data, error: queryError } = await query;

      console.log('Direct query result:', { data, error: queryError });

      if (queryError) {
        console.error('Query error:', queryError);
        setError(`Database error: ${queryError.message}`);
        return;
      }

      const _tournaments_: ITournament[] = [];
      if (data && Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          _tournaments_.push(data[i] as ITournament);
        }
      }

      console.log('Processed tournaments:', _tournaments_);
      setTournaments(_tournaments_);

      if (_tournaments_.length === 0) {
        setError('No tournaments found. Try adjusting your search filters.');
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      setError(
        `Error loading tournaments: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      _LoadTournaments();
    }, TIMEOUT_DELAY_WHEN_SEARCH);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [filters]);

  const handleDeleteTournament = async (tournament: ITournament) => {
    Alert.alert(
      'Delete Tournament',
      `Are you sure you want to delete "${tournament.tournament_name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await UpdateTournament(tournament, {
                status: ETournamentStatuses.Deleted,
                deleted_at: getLocalTimestampWithoutTimezone(new Date()),
              });
              _LoadTournaments(); // Reload the list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete tournament');
            }
          },
        },
      ],
    );
  };

  const handleEditTournament = (tournament: ITournament) => {
    setSelectedTournamentForTheModal(tournament);
    setModalForTournamentIsOpened(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ETournamentStatuses.Approved:
        return '#10b981'; // green
      case ETournamentStatuses.Pending:
        return '#f59e0b'; // yellow
      case ETournamentStatuses.Deleted:
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case ETournamentStatuses.Approved:
        return 'Approved';
      case ETournamentStatuses.Pending:
        return 'Pending';
      case ETournamentStatuses.Deleted:
        return 'Deleted';
      default:
        return status;
    }
  };

  if (filters === null) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: '#9ca3af' }}>Initializing filters...</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Debug info */}
      <View
        style={{ padding: 10, backgroundColor: '#0a0a0a', marginBottom: 10 }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 12 }}>
          Debug: Filters loaded: {filters ? 'Yes' : 'No'} | Loading:{' '}
          {loading ? 'Yes' : 'No'} | Tournaments: {tournaments.length} | Error:{' '}
          {error || 'None'}
        </Text>
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#9ca3af' }}>Loading tournaments...</Text>
        </View>
      )}

      {/* Error message */}
      {error && !loading && (
        <View
          style={{
            padding: 20,
            alignItems: 'center',
            backgroundColor: '#1f1f1f',
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      {/* Tournament Cards Grid */}
      {tournaments.length === 0 ? (
        <View
          style={{
            minHeight: 300,
          }}
        >
          <Text
            style={[
              StyleZ.h3,
              {
                textAlign: 'center',
              },
            ]}
          >
            No tournaments found. Try adjusting your filters or search terms.
          </Text>
        </View>
      ) : (
        <View
          style={[
            {
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              minHeight: 300,
            },
          ]}
        >
          {tournaments.map((tournament: ITournament, key: number) => {
            const venueName = tournament.venue || 'No venue';

            return (
              <View
                key={`tournament-${key}-${tournament.id}`}
                style={[
                  {
                    width: '48%',
                    marginBottom: BasePaddingsMargins.m15,
                    borderStyle: 'solid',
                    borderWidth: 1,
                    borderColor: BaseColors.othertexts,
                    backgroundColor: BaseColors.secondary,
                    borderRadius: BasePaddingsMargins.m10,
                    display: 'flex',
                    position: 'relative',
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleEditTournament(tournament)}
                >
                  <Image
                    source={
                      tournament.thumbnail_type === THUMBNAIL_CUSTOM
                        ? { uri: tournament.thumbnail_url }
                        : getThurnamentStaticThumb(tournament.game_type) ||
                          tournament_thumb_8_ball
                    }
                    style={[
                      {
                        width: '100%',
                        height: 120,
                        borderTopLeftRadius: BasePaddingsMargins.m10,
                        borderTopRightRadius: BasePaddingsMargins.m10,
                      },
                    ]}
                  />
                  <View
                    style={[
                      {
                        padding: BasePaddingsMargins.m10,
                      },
                    ]}
                  >
                    <View
                      style={[
                        {
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          marginBottom: BasePaddingsMargins.m10,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          StyleZ.p,
                          {
                            color: BaseColors.light,
                            fontWeight: 'bold',
                          },
                        ]}
                      >
                        {tournament.tournament_name}
                      </Text>
                      <View>
                        <UIBadge label={tournament.game_type} type="default" />
                      </View>
                    </View>

                    {tournament.start_date && (
                      <Text
                        style={[
                          StyleZ.p,
                          {
                            marginBottom: BasePaddingsMargins.m10,
                          },
                        ]}
                      >
                        {format(
                          parseISO(tournament.start_date),
                          'EEEE MMM dd, yyyy h:mm aa',
                        )}
                      </Text>
                    )}

                    <View>
                      <View
                        style={[
                          {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                          },
                        ]}
                      >
                        <Ionicons
                          name="location"
                          style={[
                            StyleZ.p,
                            {
                              marginRight: BasePaddingsMargins.m10,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            StyleZ.p,
                            {
                              width: '90%',
                            },
                          ]}
                        >
                          {venueName}
                        </Text>
                      </View>
                      <Text style={[StyleZ.p]}>
                        {tournament.address || 'No address provided'}
                      </Text>
                    </View>
                    <View
                      style={[
                        StyleZ.hr,
                        {
                          marginBlock: BasePaddingsMargins.m15,
                          marginBottom: BasePaddingsMargins.m15,
                          backgroundColor: BaseColors.othertexts,
                        },
                      ]}
                    />

                    <View
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          StyleZ.p,
                          {
                            margin: 0,
                            fontSize: TextsSizes.small,
                          },
                        ]}
                      >
                        Tournament Fee
                      </Text>
                      <Text
                        style={[
                          StyleZ.h4,
                          {
                            margin: 0,
                          },
                        ]}
                      >
                        ${tournament.tournament_fee}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Admin badges and actions overlay */}
                <View
                  style={[
                    {
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      paddingInline: BasePaddingsMargins.m5,
                      top: BasePaddingsMargins.m5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    },
                  ]}
                >
                  <UIBadge label={`ID:${tournament.id_unique_number}`} />

                  {/* Status Badge */}
                  <View
                    style={{
                      backgroundColor: getStatusColor(tournament.status),
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    >
                      {getStatusLabel(tournament.status)}
                    </Text>
                  </View>
                </View>

                {/* Admin Actions - Bottom Right */}
                <View
                  style={{
                    position: 'absolute',
                    right: BasePaddingsMargins.m5,
                    bottom: BasePaddingsMargins.m5,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {/* Edit Button */}
                  <TouchableOpacity
                    onPress={() => handleEditTournament(tournament)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: BaseColors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: BaseColors.secondary,
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="white" />
                  </TouchableOpacity>

                  {/* Delete Button */}
                  {user?.role === EUserRole.MasterAdministrator && (
                    <TouchableOpacity
                      onPress={() => handleDeleteTournament(tournament)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: BaseColors.danger,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: BaseColors.secondary,
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Tournament Detail Modal */}
      {modalForTournamentIsOpened && selectedTournamentForTheModal && (
        <ScreenBilliardModalTournament
          F_isOpened={setModalForTournamentIsOpened}
          isOpened={modalForTournamentIsOpened}
          tournament={selectedTournamentForTheModal}
          ApproveTheTournament={() => {
            _LoadTournaments();
          }}
          DeleteTheTournament={() => {
            _LoadTournaments();
          }}
          DeclineTheTournament={() => {
            _LoadTournaments();
          }}
        />
      )}
    </View>
  );
}
