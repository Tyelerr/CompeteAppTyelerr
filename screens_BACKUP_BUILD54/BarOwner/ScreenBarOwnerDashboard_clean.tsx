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
} from 'react-native';
import { useContextAuth } from '../../context/ContextAuth';
import {
  FetchBarOwnerAnalytics,
  FetchBarOwnerDirectors,
  IBarOwnerAnalytics,
} from '../../ApiSupabase/CrudBarOwner';
import {
  ICAUserData,
  EUserRole,
} from '../../hooks/InterfacesGlobal';
import { StyleZ } from '../../assets/css/styles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { FetchUsersV2, UpdateProfile } from '../../ApiSupabase/CrudUser';
import {
  assignTournamentDirectorToVenue,
} from '../../ApiSupabase/CrudVenues';
import { FetchBarOwnerVenues } from '../../ApiSupabase/CrudBarOwner';

export default function ScreenBarOwnerDashboard({ navigation }: any) {
  const { user } = useContextAuth();
  const [analytics, setAnalytics] = useState<IBarOwnerAnalytics | null>(null);
  const [directors, setDirectors] = useState<ICAUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirectorsModal, setShowDirectorsModal] = useState(false);
  const [showAddDirectorModal, setShowAddDirectorModal] = useState(false);

  // Search functionality state
  const [search, setSearch] = useState('');
  const [searchUsers, setSearchUsers] = useState<ICAUserData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUserForConfirm, setSelectedUserForConfirm] =
    useState<ICAUserData | null>(null);

  // Venue selection state
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const [showVenueSelection, setShowVenueSelection] = useState(false);

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

  // Search functionality
  useEffect(() => {
    if (showAddDirectorModal) {
      setSearch('');
      setSearchUsers([]);
      setAssigning(null);
      loadVenues();
    }
  }, [showAddDirectorModal]);

  useEffect(() => {
    if (search.trim().length > 0) {
      searchUsersFunction();
    } else {
      setSearchUsers([]);
    }
  }, [search]);

  const searchUsersFunction = async () => {
    if (!search.trim()) return;

    setSearchLoading(true);
    try {
      const { data } = await FetchUsersV2(
        user as ICAUserData,
        search.trim(),
        undefined,
        '',
        false, // Don't include deleted users
      );
      const userArray: ICAUserData[] = Array.isArray(data) ? (data as any) : [];
      setSearchUsers(userArray);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const loadVenues = async () => {
    if (!user?.id_auto) return;

    try {
      const { data, error } = await FetchBarOwnerVenues(user.id_auto);
      if (!error && data) {
        setVenues(data);
        // Auto-select first venue if only one exists
        if (data.length === 1) {
          setSelectedVenue(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading venues:', error);
    }
  };

  const confirmAssignTournamentDirector = (selectedUser: ICAUserData) => {
    if (!selectedUser || assigning) return;

    // Check if we need venue selection
    if (venues.length > 1 && !selectedVenue) {
      setSelectedUserForConfirm(selectedUser);
      setShowVenueSelection(true);
      return;
    }

    // If we have a venue (single venue or already selected), proceed to confirmation
    if (venues.length === 1 || selectedVenue) {
      setSelectedUserForConfirm(selectedUser);
      setShowConfirmModal(true);
    } else {
      Alert.alert('Error', 'No venue available for assignment');
    }
  };

  const handleVenueSelected = (venue: any) => {
    setSelectedVenue(venue);
    setShowVenueSelection(false);
    setShowConfirmModal(true);
  };

  const handleConfirmAssignment = () => {
    if (selectedUserForConfirm) {
      setShowConfirmModal(false);
      assignTournamentDirector(selectedUserForConfirm);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmModal(false);
    setSelectedUserForConfirm(null);
    setSelectedVenue(null);
    setShowAddDirectorModal(false);
  };

  const handleCancelVenueSelection = () => {
    setShowVenueSelection(false);
    setSelectedUserForConfirm(null);
    setSelectedVenue(null);
  };

  const assignTournamentDirector = async (selectedUser: ICAUserData) => {
    if (!selectedUser || assigning || !selectedVenue) return;

    setAssigning(selectedUser.id_auto);

    try {
      console.log('Assigning Tournament Director:', {
        userId: selectedUser.id_auto,
        venueId: selectedVenue.id,
        venueName: selectedVenue.venue,
        currentRole: selectedUser.role,
      });

      // Only update user role to Tournament Director if they're not already a BarAdmin
      if (selectedUser.role !== EUserRole.BarAdmin) {
        await UpdateProfile(selectedUser.id, {
          role: EUserRole.TournamentDirector,
        });
      }

      // Assign the user to the specific venue
      const result = await assignTournamentDirectorToVenue(
        selectedUser.id_auto,
        selectedVenue.id,
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Successfully assigned ${
            selectedUser.user_name || selectedUser.name
          } as Tournament Director for ${selectedVenue.venue}`,
        );

        // Refresh the directors list
        loadDashboardData();
        setShowAddDirectorModal(false);
        setShowDirectorsModal(true);
        setSelectedVenue(null);
      } else {
        throw new Error(result.error || 'Failed to assign venue');
      }
    } catch (error) {
      console.error('Error assigning tournament director:', error);
      Alert.alert(
        'Error',
        `Failed to assign tournament director: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setAssigning(null);
    }
  };

  const formatUserId = (n?: number | null) =>
    n == null ? '' : String(n).padStart(6, '0');

  const capitalizeProfileName = (name?: string) => {
    if (!name) return 'User';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
            onPress={() => navigation.navigate('BarOwnerVenues')}
          />
          <AnalyticsCard
            icon="users"
            count={analytics?.my_directors || 0}
            label="My Directors"
            color="#8b5cf6"
            onPress={() => setShowDirectorsModal(true)}
          />
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
      <Modal visible={showDirectorsModal} transparent animationType="fade">
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
                          style={{
                            backgroundColor: '#3b82f6',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 'bold',
                            }}
                          >
                            Contact
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
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
                setShowAddDirectorModal(true);
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

      {/* Add New Tournament Director Modal */}
      <Modal visible={showAddDirectorModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => setShowAddDirectorModal(false)}
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
                Add Tournament Director
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddDirectorModal(false)}
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
                { color: BaseColors.othertexts, marginBottom: 16 },
              ]}
            >
              Search for users to assign as tournament directors for your venue.
            </Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by username or ID..."
              placeholderTextColor="#6b7280"
              style={{
                color: 'white',
                borderWidth: 1,
                borderColor: BaseColors.secondary,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 16,
                backgroundColor: '#16171a',
              }}
            />

            <ScrollView style={{ maxHeight: 300 }}>
              {searchUsers.length > 0 ? (
                searchUsers.map((item) => {
                  const isAssigning = assigning === item.id_auto;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        if (!isAssigning) {
                          confirmAssignTournamentDirector(item);
                        }
                      }}
                      disabled={isAssigning}
                      style={{
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: BaseColors.secondary,
                        backgroundColor: isAssigning ? '#1e3a8
