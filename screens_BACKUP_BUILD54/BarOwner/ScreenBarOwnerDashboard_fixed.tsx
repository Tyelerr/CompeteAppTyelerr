import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import { GetVenueTournamentViewStats } from '../../ApiSupabase/CrudTournamentViews';
import { GetVenueTournamentLikesStatsByPeriod } from '../../ApiSupabase/CrudTournament';
import { ICAUserData, EUserRole } from '../../hooks/InterfacesGlobal';
import { StyleZ } from '../../assets/css/styles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { FetchUsersV2, UpdateProfile } from '../../ApiSupabase/CrudUser';
import { assignTournamentDirectorToVenue } from '../../ApiSupabase/CrudVenues';
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

  // Tournament view statistics state
  const [viewStats, setViewStats] = useState<any[]>([]);
  const [totalViews, setTotalViews] = useState(0);

  // Tournament likes statistics state
  const [likesStats, setLikesStats] = useState<any[]>([]);
  const [totalCurrentLikes, setTotalCurrentLikes] = useState(0);
  const [totalHistoricalLikes, setTotalHistoricalLikes] = useState(0);

  // Time period selector state
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<
    '24hr' | '1week' | '1month' | '1year' | 'lifetime'
  >('lifetime');
  const [periodLikes, setPeriodLikes] = useState(0);
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);

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

        // Load tournament view and likes statistics for all venues
        if (venuesResult.data && venuesResult.data.length > 0) {
          loadTournamentViewStats(venuesResult.data);
          loadTournamentLikesStats(venuesResult.data, selectedTimePeriod);
        }
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

  const loadTournamentViewStats = async (venuesList: any[]) => {
    try {
      let totalViewsCount = 0;
      const statsPromises = venuesList.map(async (venue) => {
        const { stats, error } = await GetVenueTournamentViewStats(venue.id);
        if (!error && stats) {
          // Calculate total views for all tournaments at this venue
          const venueViews = stats.reduce(
            (sum, stat) => sum + stat.total_views,
            0,
          );
          totalViewsCount += venueViews;
          return { venue: venue.venue, stats };
        }
        return { venue: venue.venue, stats: [] };
      });

      const results = await Promise.all(statsPromises);
      setViewStats(results);
      setTotalViews(totalViewsCount);
    } catch (error) {
      console.error('Error loading tournament view stats:', error);
    }
  };

  const loadTournamentLikesStats = async (
    venuesList: any[],
    period: '24hr' | '1week' | '1month' | '1year' | 'lifetime' = 'lifetime',
  ) => {
    try {
      console.log(
        `[Dashboard] Loading likes stats for ${venuesList.length} venues, period: ${period}`,
      );

      let totalCurrentLikesCount = 0;
      let totalHistoricalLikesCount = 0;
      let totalPeriodLikesCount = 0;

      const likesStatsPromises = venuesList.map(async (venue) => {
        console.log(
          `[Dashboard] Processing venue: ${venue.venue} (ID: ${venue.id})`,
        );

        const stats = await GetVenueTournamentLikesStatsByPeriod(
          venue.id,
          period,
        );

        console.log(`[Dashboard] Stats for venue ${venue.venue}:`, stats);

        if (!stats.error) {
          totalCurrentLikesCount += stats.currentActiveLikes || 0;
          totalHistoricalLikesCount += stats.totalHistoricalLikes || 0;
          totalPeriodLikesCount += stats.periodLikes || 0;
          return {
            venue: venue.venue,
            currentLikes: stats.currentActiveLikes || 0,
            historicalLikes: stats.totalHistoricalLikes || 0,
            periodLikes: stats.periodLikes || 0,
            uniqueUsers: stats.uniqueUsersWhoLiked || 0,
            debug: stats.debug,
          };
        } else {
          console.error(
            `[Dashboard] Error for venue ${venue.venue}:`,
            stats.error,
          );
          return {
            venue: venue.venue,
            currentLikes: 0,
            historicalLikes: 0,
            periodLikes: 0,
            uniqueUsers: 0,
            error: stats.error,
          };
        }
      });

      const results = await Promise.all(likesStatsPromises);
      console.log(`[Dashboard] Final results for period ${period}:`, {
        results,
        totalCurrentLikes: totalCurrentLikesCount,
        totalHistoricalLikes: totalHistoricalLikesCount,
        totalPeriodLikes: totalPeriodLikesCount,
      });

      setLikesStats(results);
      setTotalCurrentLikes(totalCurrentLikesCount);
      setTotalHistoricalLikes(totalHistoricalLikesCount);
      setPeriodLikes(totalPeriodLikesCount);
    } catch (error) {
      console.error('Error loading tournament likes stats:', error);
    }
  };

  // Function to handle time period changes
  const handleTimePeriodChange = async (
    period: '24hr' | '1week' | '1month' | '1year' | 'lifetime',
  ) => {
    setSelectedTimePeriod(period);
    setShowTimePeriodDropdown(false);
    if (venues && venues.length > 0) {
      await loadTournamentLikesStats(venues, period);
    }
  };

  // Helper function to get period display name
  const getPeriodDisplayName = (period: string) => {
    switch (period) {
      case '24hr':
        return '24 Hours';
      case '1week':
        return '1 Week';
      case '1month':
        return '1 Month';
      case '1year':
        return '1 Year';
      case 'lifetime':
        return 'Lifetime';
      default:
        return 'Lifetime';
    }
  };

  const confirmAssignTournamentDirector = (selectedUser: ICAUserData) => {
    if (!selectedUser || assigning) return;

    // Check if we have any venues at all
    if (!venues || venues.length === 0) {
      Alert.alert(
        'Error',
        'No venues found. Please create a venue first before assigning tournament directors.',
      );
      return;
    }

    // Check if we need venue selection
    if (venues.length > 1 && !selectedVenue) {
      setSelectedUserForConfirm(selectedUser);
      setShowVenueSelection(true);
      return;
    }

    // Determine which venue to use
    let venueToUse = selectedVenue;
    if (venues.length === 1 && !selectedVenue) {
      venueToUse = venues[0];
    }

    // Validate the venue has a valid ID
    if (!venueToUse || !venueToUse.id || typeof venueToUse.id !== 'number') {
      Alert.alert(
        'Error',
        'Invalid venue selected. Please try selecting a different venue.',
      );
      return;
    }

    // Set the venue and proceed to confirmation
    setSelectedVenue(venueToUse);
    setSelectedUserForConfirm(selectedUser);
    setShowConfirmModal(true);
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
          { flex: 1, backgroundColor: BaseColors.backgroundColor },
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
          { flex: 1, backgroundColor: BaseColors.backgroundColor },
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
    <View style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}>
      <ScrollView
        style={{ flex: 1 }}
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
              {
                color: BaseColors.light,
                marginBottom: BasePaddingsMargins.m20,
              },
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
              {/* Time Period Selector - SIMPLE VERTICAL LAYOUT */}
              <View
                style={{
                  marginBottom: 16,
                }}
              >
                <Text
                  style={[
                    StyleZ.p,
                    {
                      color: BaseColors.light,
                      fontSize: 14,
                      fontWeight: 'bold',
                      marginBottom: 8,
                    },
                  ]}
                >
                  Time Period: {getPeriodDisplayName(selectedTimePeriod)}
                </Text>

                {/* SIMPLE VERTICAL BUTTON LIST - GUARANTEED TO BE VISIBLE */}
                <View
                  style={{
                    backgroundColor: BaseColors.secondary,
                    padding: 8,
                    borderRadius: 6,
                  }}
                >
                  {(
                    [
                      { key: '24hr', label: '24 Hours' },
                      { key: '1week', label: '1 Week' },
                      { key: '1month', label: '1 Month' },
                      { key: '1year', label: '1 Year' },
                      { key: 'lifetime', label: 'Lifetime' },
                    ] as const
                  ).map((period, index) => (
                    <TouchableOpacity
                      key={period.key}
                      onPress={() => {
                        console.log(`[DEBUG] Button pressed: ${period.key}`);
                        handleTimePeriodChange(period.key as any);
                      }}
                      style={{
                        backgroundColor:
                          selectedTimePeriod === period.key
                            ? BaseColors.primary
                            : 'transparent',
                        borderRadius: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        marginBottom: index < 4 ? 4 : 0,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor:
                          selectedTimePeriod === period.key
                            ? BaseColors.primary
                            : BaseColors.othertexts,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            selectedTimePeriod === period.key
                              ? BaseColors.light
                              : BaseColors.othertexts,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        {period.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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

              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                    Tournament Views
                  </Text>
                  <Text style={[StyleZ.h3, { color: '#f59e0b' }]}>
                    {totalViews}
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
                    Current Favorites
                  </Text>
                  <Text style={[StyleZ.h3, { color: '#e11d48' }]}>
                    {totalCurrentLikes}
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
                    {selectedTimePeriod === 'lifetime'
                      ? 'Total Likes Ever'
                      : `Likes (${getPeriodDisplayName(selectedTimePeriod)})`}
                  </Text>
                  <Text style={[StyleZ.h3, { color: '#ec4899' }]}>
                    {selectedTimePeriod === 'lifetime'
                      ? totalHistoricalLikes
                      : periodLikes}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Directors Modal */}
      <Modal
        visible={showDirectorsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: BasePaddingsMargins.m20,
              borderBottomWidth: 1,
              borderBottomColor: BaseColors.secondary,
            }}
          >
            <Text style={[StyleZ.h2, { color: BaseColors.light }]}>
              My Tournament Directors
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDirectorsModal(false);
                  setShowAddDirectorModal(true);
                }}
                style={{
                  backgroundColor: BaseColors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                  Add Director
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDirectorsModal(false)}
                style={{
                  backgroundColor: BaseColors.secondary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1, padding: BasePaddingsMargins.m20 }}>
            {directors.length > 0 ? (
              directors.map((director, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: BaseColors.dark,
                    padding: BasePaddingsMargins.m15,
                    borderRadius: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: BaseColors.secondary,
                  }}
                >
                  <Text style={[StyleZ.h4, { color: BaseColors.light }]}>
                    {capitalizeProfileName(director.user_name || director.name)}
                  </Text>
                  <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                    ID: {formatUserId(director.id_auto)}
                  </Text>
                  <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                    Role: {director.role}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                style={[
                  StyleZ.p,
                  {
                    color: BaseColors.othertexts,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    marginTop: 50,
                  },
                ]}
              >
                No tournament directors assigned yet
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Add Director Modal */}
      <Modal
        visible={showAddDirectorModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: BasePaddingsMargins.m20,
              borderBottomWidth: 1,
              borderBottomColor: BaseColors.secondary,
            }}
          >
            <Text style={[StyleZ.h2, { color: BaseColors.light }]}>
              Add Tournament Director
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddDirectorModal(false)}
              style={{
                backgroundColor: BaseColors.secondary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
              }}
            >
              <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: BasePaddingsMargins.m20 }}>
            <TextInput
              style={{
                backgroundColor: BaseColors.dark,
                color: BaseColors.light,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: BaseColors.secondary,
                marginBottom: 16,
              }}
              placeholder="Search users by name or ID..."
              placeholderTextColor={BaseColors.othertexts}
              value={search}
              onChangeText={setSearch}
            />

            {searchLoading && (
              <ActivityIndicator
                size="small"
                color={BaseColors.primary}
                style={{ marginBottom: 16 }}
              />
            )}

            <ScrollView style={{ maxHeight: 400 }}>
              {searchUsers.map((searchUser, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => confirmAssignTournamentDirector(searchUser)}
                  disabled={assigning === searchUser.id_auto}
                  style={{
                    backgroundColor: BaseColors.dark,
                    padding: BasePaddingsMargins.m15,
                    borderRadius: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: BaseColors.secondary,
                    opacity: assigning === searchUser.id_auto ? 0.5 : 1,
                  }}
                >
                  <Text style={[StyleZ.h4, { color: BaseColors.light }]}>
                    {capitalizeProfileName(
                      searchUser.user_name || searchUser.name,
                    )}
                  </Text>
                  <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                    ID: {formatUserId(searchUser.id_auto)}
                  </Text>
                  <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                    Current Role: {searchUser.role}
                  </Text>
                  {assigning === searchUser.id_auto && (
                    <ActivityIndicator
                      size="small"
                      color={BaseColors.primary}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Venue Selection Modal */}
      <Modal
        visible={showVenueSelection}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: BasePaddingsMargins.m20,
              borderBottomWidth: 1,
              borderBottomColor: BaseColors.secondary,
            }}
          >
            <Text style={[StyleZ.h2, { color: BaseColors.light }]}>
              Select Venue
            </Text>
            <TouchableOpacity
              onPress={handleCancelVenueSelection}
              style={{
                backgroundColor: BaseColors.secondary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
              }}
            >
              <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: BasePaddingsMargins.m20 }}>
            {venues.map((venue, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleVenueSelected(venue)}
                style={{
                  backgroundColor: BaseColors.dark,
                  padding: BasePaddingsMargins.m15,
                  borderRadius: 8,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: BaseColors.secondary,
                }}
              >
                <Text style={[StyleZ.h4, { color: BaseColors.light }]}>
                  {venue.venue}
                </Text>
                <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                  ID: {venue.id}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} animationType="fade" transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: BaseColors.dark,
              padding: BasePaddingsMargins.m20,
              borderRadius: 12,
              width: '80%',
              borderWidth: 1,
              borderColor: BaseColors.secondary,
            }}
          >
            <Text
              style={[
                StyleZ.h3,
                {
                  color: BaseColors.light,
                  marginBottom: 16,
                  textAlign: 'center',
                },
              ]}
            >
              Confirm Assignment
            </Text>
            <Text
              style={[
                StyleZ.p,
                {
                  color: BaseColors.othertexts,
                  marginBottom: 20,
                  textAlign: 'center',
                },
              ]}
            >
              Assign{' '}
              {capitalizeProfileName(
                selectedUserForConfirm?.user_name ||
                  selectedUserForConfirm?.name,
              )}{' '}
              as Tournament Director for {selectedVenue?.venue}?
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}
            >
              <TouchableOpacity
                onPress={handleCancelConfirmation}
                style={{
                  backgroundColor: BaseColors.secondary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 6,
                }}
              >
                <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmAssignment}
                style={{
                  backgroundColor: BaseColors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 6,
                }}
              >
                <Text style={[StyleZ.p, { color: BaseColors.light }]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Period Selection Modal */}
      <Modal
        visible={showTimePeriodDropdown}
        animationType="fade"
        transparent={true}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: BaseColors.dark,
              padding: BasePaddingsMargins.m20,
              borderRadius: 12,
              width: '80%',
              maxWidth: 300,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
            }}
          >
            <Text
              style={[
                StyleZ.h3,
                {
                  color: BaseColors.light,
                  marginBottom: 16,
                  textAlign: 'center',
                },
              ]}
            >
              Select Time Period
            </Text>

            {(['24hr', '1week', '1month', '1year', 'lifetime'] as const).map(
              (period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => handleTimePeriodChange(period)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor:
                      selectedTimePeriod === period
                        ? BaseColors.primary
                        : BaseColors.secondary,
                    borderWidth: 1,
                    borderColor:
                      selectedTimePeriod === period
                        ? BaseColors.primary
                        : BaseColors.secondary,
                  }}
                >
                  <Text
                    style={{
                      color: BaseColors.light,
                      fontSize: 16,
                      fontWeight:
                        selectedTimePeriod === period ? 'bold' : 'normal',
                      textAlign: 'center',
                    }}
                  >
                    {getPeriodDisplayName(period)}
                  </Text>
                </TouchableOpacity>
              ),
            )}

            <TouchableOpacity
              onPress={() => setShowTimePeriodDropdown(false)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 8,
                backgroundColor: BaseColors.secondary,
                borderWidth: 1,
                borderColor: BaseColors.secondary,
              }}
            >
              <Text
                style={{
                  color: BaseColors.light,
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
