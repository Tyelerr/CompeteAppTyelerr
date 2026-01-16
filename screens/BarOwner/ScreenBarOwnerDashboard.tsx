import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  RefreshControl,
  TextInput,
  Alert,
  Pressable,
  Keyboard,
} from 'react-native';
import { useContextAuth } from '../../context/ContextAuth';
import {
  FetchBarOwnerAnalytics,
  FetchBarOwnerDirectors,
  IBarOwnerAnalytics,
} from '../../ApiSupabase/CrudBarOwner';
import { ICAUserData, EUserRole, IVenue } from '../../hooks/InterfacesGlobal';
import { StyleZ } from '../../assets/css/styles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { FetchUsersV2, UpdateProfile } from '../../ApiSupabase/CrudUser';
import {
  assignTournamentDirectorToVenue,
  updateVenue,
  removeTournamentDirectorFromVenueByUser,
} from '../../ApiSupabase/CrudVenues';
import { FetchBarOwnerVenues } from '../../ApiSupabase/CrudBarOwner';
import ModalCreateVenue from '../Shop/ModalCreateVenue';
import ModalAssignTournamentDirector from '../Shop/ModalAssignTournamentDirector';

export default function ScreenBarOwnerDashboard() {
  const { user } = useContextAuth();
  const [analytics, setAnalytics] = useState<IBarOwnerAnalytics | null>(null);
  const [directors, setDirectors] = useState<ICAUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirectorsModal, setShowDirectorsModal] = useState(false);
  const [showAddDirectorModal, setShowAddDirectorModal] = useState(false);
  const [selectedVenueForTD, setSelectedVenueForTD] = useState<any | null>(
    null,
  );

  // Venue state
  const [venues, setVenues] = useState<any[]>([]);

  // Venue modal state
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [showEditVenueModal, setShowEditVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<IVenue | null>(null);

  // Time period filter state
  const [timePeriod, setTimePeriod] = useState<
    'lifetime' | 'monthly' | 'weekly' | 'daily'
  >('lifetime');
  const [showTimePeriodModal, setShowTimePeriodModal] = useState(false);

  useEffect(() => {
    if (user?.id_auto) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async (isRefresh = false) => {
    if (!user?.id_auto) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Load analytics, directors, and venues data
      const [analyticsResult, directorsResult, venuesResult] =
        await Promise.all([
          FetchBarOwnerAnalytics(user.id_auto),
          FetchBarOwnerDirectors(user.id_auto),
          FetchBarOwnerVenues(user.id_auto),
        ]);

      if (analyticsResult.error) {
        setError('Failed to load analytics data');
        console.error('Analytics error:', analyticsResult.error);
      } else {
        setAnalytics(analyticsResult.data);
      }

      if (directorsResult.error) {
        console.error('Directors error:', directorsResult.error);
      } else {
        setDirectors(directorsResult.data || []);
      }

      if (venuesResult.error) {
        console.error('Venues error:', venuesResult.error);
      } else {
        setVenues(venuesResult.data || []);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    loadDashboardData(true);
  };

  const handleOpenAddDirector = () => {
    if (venues.length === 0) {
      Alert.alert(
        'No Venues',
        'Please create a venue first before assigning tournament directors.',
      );
      return;
    }

    if (venues.length === 1) {
      // Auto-select the only venue
      setSelectedVenueForTD(venues[0]);
      setShowAddDirectorModal(true);
    } else {
      // Show venue selection first
      Alert.alert(
        'Select Venue',
        'Which venue would you like to assign a tournament director to?',
        venues
          .map((venue) => ({
            text: venue.venue,
            onPress: () => {
              setSelectedVenueForTD(venue);
              setShowAddDirectorModal(true);
            },
          }))
          .concat([{ text: 'Cancel', onPress: () => {} }]),
      );
    }
  };

  const handleRemoveDirector = async (director: ICAUserData) => {
    // Since a director can be assigned to multiple venues, we need to ask which venue to remove them from
    if (venues.length === 0) {
      Alert.alert('Error', 'No venues found');
      return;
    }

    if (venues.length === 1) {
      // Only one venue, confirm removal
      Alert.alert(
        'Confirm Removal',
        `Remove ${
          director.name || director.user_name
        } as Tournament Director from ${venues[0].venue}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const result = await removeTournamentDirectorFromVenueByUser(
                director.id_auto,
                venues[0].id,
              );

              if (result.success) {
                Alert.alert(
                  'Success',
                  `Removed ${director.name || director.user_name} from ${
                    venues[0].venue
                  }`,
                );
                loadDashboardData(); // Refresh data
              } else {
                Alert.alert(
                  'Error',
                  result.error || 'Failed to remove director',
                );
              }
            },
          },
        ],
      );
    } else {
      // Multiple venues - ask which one to remove from
      Alert.alert(
        'Select Venue',
        `Remove ${director.name || director.user_name} from which venue?`,
        venues
          .map((venue) => ({
            text: venue.venue,
            onPress: async () => {
              const result = await removeTournamentDirectorFromVenueByUser(
                director.id_auto,
                venue.id,
              );

              if (result.success) {
                Alert.alert(
                  'Success',
                  `Removed ${director.name || director.user_name} from ${
                    venue.venue
                  }`,
                );
                loadDashboardData(); // Refresh data
              } else {
                Alert.alert(
                  'Error',
                  result.error || 'Failed to remove director',
                );
              }
            },
          }))
          .concat([{ text: 'Cancel', onPress: async () => {} }]),
      );
    }
  };

  const AnalyticsCard = ({
    icon,
    count,
    label,
    color = BaseColors.primary,
    onPress,
  }: {
    icon: string;
    count: number;
    label: string;
    color?: string;
    onPress?: () => void;
  }) => {
    const CardContent = (
      <View
        style={[
          {
            backgroundColor: BaseColors.dark,
            borderRadius: 8,
            padding: BasePaddingsMargins.m20,
            flex: 1,
            marginHorizontal: 4,
            borderWidth: 1,
            borderColor: BaseColors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 100,
          },
        ]}
      >
        <Text style={{ fontSize: 24, marginBottom: 8, color: color }}>
          {icon === 'trophy'
            ? '🏆'
            : icon === 'check-circle'
            ? '✅'
            : icon === 'venue'
            ? '🏢'
            : '👥'}
        </Text>
        <Text
          style={[
            StyleZ.h1,
            { color: BaseColors.light, fontSize: 28, marginBottom: 4 },
          ]}
        >
          {count}
        </Text>
        <Text
          style={[
            StyleZ.p,
            { color: BaseColors.othertexts, fontSize: 12, textAlign: 'center' },
          ]}
        >
          {label}
        </Text>
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress}>{CardContent}</TouchableOpacity>
      );
    }

    return CardContent;
  };

  const EventTypeBar = ({
    gameType,
    count,
    maxCount,
  }: {
    gameType: string;
    count: number;
    maxCount: number;
  }) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return (
      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={[StyleZ.p, { color: BaseColors.light, fontSize: 14 }]}>
            {gameType}
          </Text>
          <Text
            style={[StyleZ.p, { color: BaseColors.othertexts, fontSize: 14 }]}
          >
            {count}
          </Text>
        </View>
        <View
          style={{
            height: 6,
            backgroundColor: BaseColors.secondary,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: BaseColors.primary,
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    );
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
          Loading dashboard...
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
          Error Loading Dashboard
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
          onPress={() => loadDashboardData()}
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

  const maxEventTypeCount =
    analytics?.event_types.reduce(
      (max, item) => Math.max(max, item.count),
      0,
    ) || 1;

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
        {/* Header */}
        <Text
          style={[
            StyleZ.h1,
            { color: BaseColors.light, marginBottom: BasePaddingsMargins.m20 },
          ]}
        >
          Bar Owner Dashboard
        </Text>

        {/* Analytics Cards Row */}
        <View
          style={{
            flexDirection: 'row',
            marginBottom: BasePaddingsMargins.m20,
            marginHorizontal: -4,
          }}
        >
          <AnalyticsCard
            icon="trophy"
            count={analytics?.my_tournaments || 0}
            label="My Tournaments"
            color="#10b981"
          />
          <AnalyticsCard
            icon="check-circle"
            count={analytics?.active_events || 0}
            label="Active Events"
            color="#3b82f6"
          />
          <AnalyticsCard
            icon="venue"
            count={venues.length || 0}
            label="Venues"
            color="#f59e0b"
            onPress={() => setShowAddVenueModal(true)}
          />
          <AnalyticsCard
            icon="users"
            count={analytics?.my_directors || 0}
            label="My Directors"
            color="#8b5cf6"
            onPress={() => setShowDirectorsModal(true)}
          />
        </View>

        {/* Time Period Filter */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: BasePaddingsMargins.m20,
          }}
        >
          <Text style={[StyleZ.h3, { color: BaseColors.light }]}>
            Time Period Filter
          </Text>
          <TouchableOpacity
            onPress={() => setShowTimePeriodModal(true)}
            style={{
              backgroundColor: BaseColors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', marginRight: 8 }}>
              {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
            </Text>
            <Text style={{ color: 'white' }}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Row - Event Types and Venue Performance */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: -8,
          }}
        >
          {/* Event Types Panel */}
          <View
            style={[
              {
                backgroundColor: BaseColors.dark,
                borderRadius: 8,
                padding: BasePaddingsMargins.m20,
                flex: 1,
                marginHorizontal: 8,
                borderWidth: 1,
                borderColor: BaseColors.secondary,
              },
            ]}
          >
            <Text
              style={[
                StyleZ.h3,
                {
                  color: BaseColors.light,
                  marginBottom: BasePaddingsMargins.m15,
                },
              ]}
            >
              Event Types
            </Text>

            {analytics?.event_types && analytics.event_types.length > 0 ? (
              analytics.event_types.map((eventType, index) => (
                <EventTypeBar
                  key={index}
                  gameType={eventType.game_type}
                  count={eventType.count}
                  maxCount={maxEventTypeCount}
                />
              ))
            ) : (
              <Text
                style={[
                  StyleZ.p,
                  {
                    color: BaseColors.othertexts,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  },
                ]}
              >
                No event data available
              </Text>
            )}
          </View>

          {/* Venue Performance Panel */}
          <View
            style={[
              {
                backgroundColor: BaseColors.dark,
                borderRadius: 8,
                padding: BasePaddingsMargins.m20,
                flex: 1,
                marginHorizontal: 8,
                borderWidth: 1,
                borderColor: BaseColors.secondary,
              },
            ]}
          >
            <Text
              style={[
                StyleZ.h3,
                {
                  color: BaseColors.light,
                  marginBottom: BasePaddingsMargins.m15,
                },
              ]}
            >
              Venue Performance
            </Text>

            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                  Monthly Events
                </Text>
                <Text style={[StyleZ.h3, { color: BaseColors.primary }]}>
                  {analytics?.venue_performance.monthly_events || 0}
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                  Success Rate
                </Text>
                <Text style={[StyleZ.h3, { color: BaseColors.success }]}>
                  {analytics?.venue_performance.success_rate || 0}%
                </Text>
              </View>
            </View>

            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                  Active Directors
                </Text>
                <Text style={[StyleZ.h3, { color: BaseColors.primary }]}>
                  {analytics?.venue_performance.active_directors || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tournament Directors Modal */}
      <Modal
        visible={showDirectorsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDirectorsModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setShowDirectorsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#141416',
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 14,
              padding: 20,
              width: '100%',
              maxWidth: 500,
              maxHeight: '80%',
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={[StyleZ.h2, { color: BaseColors.light }]}>
                My Tournament Directors
              </Text>
              <TouchableOpacity
                onPress={() => setShowDirectorsModal(false)}
                style={{
                  backgroundColor: '#dc2626',
                  borderRadius: 20,
                  width: 30,
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                StyleZ.p,
                { color: BaseColors.othertexts, marginBottom: 20 },
              ]}
            >
              Tournament directors who can manage tournaments for your venue.
            </Text>

            {/* Directors List */}
            <ScrollView style={{ maxHeight: 400 }}>
              {directors.length === 0 ? (
                <View
                  style={{
                    alignItems: 'center',
                    paddingVertical: 40,
                    backgroundColor: BaseColors.dark,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: BaseColors.secondary,
                  }}
                >
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
                  <Text
                    style={[
                      StyleZ.h3,
                      { color: BaseColors.light, marginBottom: 8 },
                    ]}
                  >
                    No Directors Assigned
                  </Text>
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.othertexts, textAlign: 'center' },
                    ]}
                  >
                    Contact an administrator to assign tournament directors to
                    your venue.
                  </Text>
                </View>
              ) : (
                directors.map((director, index) => {
                  const initials = (director.name || director.user_name || 'TD')
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase())
                    .join('')
                    .substring(0, 2);

                  return (
                    <View
                      key={director.id}
                      style={{
                        backgroundColor: BaseColors.dark,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: BaseColors.secondary,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      {/* Avatar */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: '#3b82f6',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 14,
                          }}
                        >
                          {initials}
                        </Text>
                      </View>

                      {/* Director Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            StyleZ.h3,
                            { color: BaseColors.light, marginBottom: 2 },
                          ]}
                        >
                          {director.name || director.user_name}
                        </Text>
                        <Text
                          style={[
                            StyleZ.p,
                            { color: BaseColors.othertexts, fontSize: 12 },
                          ]}
                        >
                          {director.email}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 4,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: '#10b981',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                              marginRight: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 10,
                                fontWeight: 'bold',
                              }}
                            >
                              Active
                            </Text>
                          </View>
                          <Text
                            style={[
                              StyleZ.p,
                              { color: BaseColors.othertexts, fontSize: 10 },
                            ]}
                          >
                            Managing tournaments
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          onPress={() => handleRemoveDirector(director)}
                          style={{
                            backgroundColor: '#dc2626',
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 'bold',
                            }}
                          >
                            ×
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Add New Director Button */}
            <TouchableOpacity
              onPress={() => {
                setShowDirectorsModal(false);
                handleOpenAddDirector();
              }}
              style={{
                backgroundColor: BaseColors.primary,
                borderRadius: 8,
                padding: 12,
                marginTop: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>👥</Text>
              <Text style={[StyleZ.h3, { color: 'white' }]}>
                Add New Tournament Director
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Tournament Director Modal - Using dedicated component */}
      {selectedVenueForTD && (
        <ModalAssignTournamentDirector
          visible={showAddDirectorModal}
          onClose={() => {
            setShowAddDirectorModal(false);
            setSelectedVenueForTD(null);
          }}
          onAssigned={() => {
            loadDashboardData();
            setShowDirectorsModal(true);
          }}
          venueId={selectedVenueForTD.id}
          venueName={selectedVenueForTD.venue}
        />
      )}

      {/* Time Period Selection Modal */}
      <Modal
        visible={showTimePeriodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePeriodModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setShowTimePeriodModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#141416',
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 14,
              padding: 20,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontWeight: '800',
                fontSize: 18,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Select Time Period
            </Text>

            {(['lifetime', 'monthly', 'weekly', 'daily'] as const).map(
              (period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => {
                    setTimePeriod(period);
                    setShowTimePeriodModal(false);
                    loadDashboardData(); // Refresh with new period
                  }}
                  style={{
                    backgroundColor:
                      timePeriod === period ? '#3b82f6' : '#16171a',
                    borderWidth: 1,
                    borderColor:
                      timePeriod === period ? '#3b82f6' : BaseColors.secondary,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: timePeriod === period ? '700' : '400',
                      fontSize: 16,
                      textAlign: 'center',
                    }}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ),
            )}

            <TouchableOpacity
              onPress={() => setShowTimePeriodModal(false)}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: '#6b7280',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Venue Modal */}
      <ModalCreateVenue
        visible={showAddVenueModal}
        onClose={() => setShowAddVenueModal(false)}
        onCreated={(venue) => {
          console.log('Venue created:', venue);
          setShowAddVenueModal(false);
          loadDashboardData(); // Refresh data after venue creation
        }}
        barownerId={user?.id_auto}
      />

      {/* Edit Venue Modal */}
      <ModalCreateVenue
        visible={showEditVenueModal}
        onClose={() => {
          setShowEditVenueModal(false);
          setEditingVenue(null);
        }}
        onCreated={(venue) => {
          console.log('Venue updated:', venue);
          setShowEditVenueModal(false);
          setEditingVenue(null);
          loadDashboardData(); // Refresh data after venue update
        }}
        prefilledData={
          editingVenue
            ? {
                name: editingVenue.venue || '',
                address: editingVenue.address || '',
                city: '', // These fields may not exist in IVenue
                state: '',
                zipCode: '',
                phone: editingVenue.phone || '',
              }
            : undefined
        }
        barownerId={user?.id_auto}
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
