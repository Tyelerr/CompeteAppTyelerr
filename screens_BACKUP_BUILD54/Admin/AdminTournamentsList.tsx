import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ITournament,
  ETournamentStatuses,
  EUserRole,
} from '../../hooks/InterfacesGlobal';
import { useEffect, useRef, useState } from 'react';
import {
  FetchTournaments,
  FetchTournaments2,
  UpdateTournament,
} from '../../ApiSupabase/CrudTournament';
import { IAdminTournamentsFilters } from './AdminTournamentsFIlters';
import { TIMEOUT_DELAY_WHEN_SEARCH } from '../../hooks/constants';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { useContextAuth } from '../../context/ContextAuth';
import { getLocalTimestampWithoutTimezone } from '../../hooks/hooks';
import ScreenBilliardModalTournament from '../Billiard/ScreenBilliardModalTournament';

export default function AdminTournamentsList({
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
        filterVenue,
        filterId,
        filter_status,
        sortBy,
        sortTypeIsAsc,
      } = filters;

      console.log('Loading tournaments with filters:', {
        searchingTerm,
        filterType,
        filterVenue,
        filterId,
        filter_status,
        sortBy,
        sortTypeIsAsc,
      });

      // Try FetchTournaments2 first
      let result = await FetchTournaments2(
        searchingTerm || '',
        filterType || '',
        filterVenue || '',
        filterId || '',
        filter_status || '', // Pass empty string instead of undefined
        {
          sortBy: sortBy || 'id_unique_number',
          sortTypeIsAsc: sortTypeIsAsc || false,
        },
      );

      console.log('FetchTournaments2 result:', result);

      // If FetchTournaments2 fails or returns no data, try FetchTournaments as fallback
      if (
        !result ||
        !result.data ||
        (Array.isArray(result.data) && result.data.length === 0)
      ) {
        console.log(
          'FetchTournaments2 failed or returned no data, trying FetchTournaments fallback...',
        );
        result = await FetchTournaments(
          searchingTerm || '',
          filterType || '',
          filterVenue || '',
          filterId || '',
          filter_status || '',
          {
            sortBy: sortBy || 'id_unique_number',
            sortTypeIsAsc: sortTypeIsAsc || false,
          },
        );
        console.log('FetchTournaments fallback result:', result);
      }

      const _tournaments_: ITournament[] = [];
      if (result && result.data && Array.isArray(result.data)) {
        for (let i = 0; i < result.data.length; i++) {
          _tournaments_.push(result.data[i] as ITournament);
        }
      } else {
        console.log('No data returned or data is not an array:', result);
        if (result && result.error) {
          console.error('API Error:', result.error);
          setError(`API Error: ${JSON.stringify(result.error)}`);
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

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: '#1a1a1a',
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: '#9ca3af', fontWeight: '700', flex: 1 }}>
          Tournament Name
        </Text>
        <Text
          style={{
            color: '#9ca3af',
            fontWeight: '700',
            width: 80,
            textAlign: 'center',
          }}
        >
          Game Type
        </Text>
        <Text
          style={{
            color: '#9ca3af',
            fontWeight: '700',
            width: 60,
            textAlign: 'center',
          }}
        >
          ID
        </Text>
        <Text
          style={{
            color: '#9ca3af',
            fontWeight: '700',
            width: 80,
            textAlign: 'center',
          }}
        >
          Status
        </Text>
        <Text
          style={{
            color: '#9ca3af',
            fontWeight: '700',
            width: 80,
            textAlign: 'center',
          }}
        >
          Actions
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

      {/* Tournament list */}
      {tournaments.map((tournament: ITournament, key: number) => {
        const venueName =
          tournament.venues !== null && tournament.venues !== undefined
            ? tournament.venues.venue
            : tournament.venue || 'No venue';

        return (
          <View
            key={`tournament-${key}-${tournament.id}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: '#161618',
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
            }}
          >
            {/* Tournament Name & Venue */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => handleEditTournament(tournament)}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: '700',
                  fontSize: 14,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {tournament.tournament_name || 'Unnamed Tournament'}
              </Text>
              <Text
                style={{
                  color: '#9ca3af',
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                📍 {venueName}
              </Text>
            </TouchableOpacity>

            {/* Game Type */}
            <View style={{ width: 80, alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: '#3b82f6',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
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
                  {tournament.game_type || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Tournament ID */}
            <View style={{ width: 60, alignItems: 'center' }}>
              <Text
                style={{
                  color: '#9ca3af',
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                #{tournament.id_unique_number}
              </Text>
            </View>

            {/* Status */}
            <View style={{ width: 80, alignItems: 'center' }}>
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

            {/* Actions */}
            <View
              style={{
                width: 80,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {/* Edit Button */}
              <TouchableOpacity
                onPress={() => handleEditTournament(tournament)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#1e40af',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
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
                    backgroundColor: '#dc2626',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {/* Empty state */}
      {!loading && !error && tournaments.length === 0 && (
        <View
          style={{
            padding: 40,
            alignItems: 'center',
            backgroundColor: '#161618',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
          }}
        >
          <Ionicons name="trophy-outline" size={48} color="#6b7280" />
          <Text
            style={{ color: '#9ca3af', marginTop: 16, textAlign: 'center' }}
          >
            No tournaments found
          </Text>
          <Text
            style={{
              color: '#6b7280',
              marginTop: 4,
              textAlign: 'center',
              fontSize: 12,
            }}
          >
            Try adjusting your filters or search terms
          </Text>
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
