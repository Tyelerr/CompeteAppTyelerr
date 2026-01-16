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
import {
  GetVenueTournamentLikesStatsByPeriod,
} from '../../ApiSupabase/CrudTournament';
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
      console.log(`[Dashboard] Loading likes stats for ${venuesList.length} venues, period: ${period}`);
      
      let totalCurrentLikesCount = 0;
      let totalHistoricalLikesCount = 0;
      let totalPeriodLikesCount = 0;

      const likesStatsPromises = venuesList.map(async (venue) => {
        console.log(`[Dashboard] Processing venue: ${venue.venue} (ID: ${venue.id})`);
        
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
          console.error(`[Dashboard] Error for venue ${venue.venue}:`, stats.error);
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
    console.log(`[Dashboard] Changing time period to: ${period}`);
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
        return 'Day';
      case '1week':
        return 'Week';
      case '1month':
        return 'Month';
      case '1year':
        return 'Year';
      case 'lifetime':
        return 'Lifetime';
      default:
        return 'Lifetime';
    }
  };

  // Helper function to get period short name
  const getPeriodShortName = (period: string) => {
    switch (period) {
      case '24hr':
        return 'Day';
      case '1week':
        return 'Week';
      case '1month':
        return 'Month';
      case '1year':
        return 'Year';
      case 'lifetime':
        return 'All';
      default:
        return 'All';
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
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: BasePaddingsMargins.m15,
                }}
              >
                <Text
                  style={[
                    StyleZ.h3,
                    {
                      color: BaseColors.light,
                    },
                  ]}
                >
                  Venue Performance
                </Text>

                {/* Time Period Dropdown Selector */}
                <View style={{ position: 'relative' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        color: BaseColors.othertexts,
                        fontSize: 12,
                        marginRight: 6,
                      }}
                    >
                      View:
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        console.log('[Dashboard] Dropdown clicked, current state:', showTimePeriodDropdown);
                        setShowTimePeriodDropdown(!showTimePeriodDropdown);
                      }}
                      style={{
                        backgroundColor: BaseColors.secondary,
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        minWidth: 80,
                      }}
                    >
                      <Text
                        style={{
                          color: BaseColors.light,
                          fontSize: 11,
                          fontWeight: 'bold',
                          marginRight: 4,
                        }}
                      >
                        {getPeriodShortName(selectedTimePeriod)}
                      </Text>
                      <Text
                        style={{
                          color: BaseColors.othertexts,
                          fontSize: 10,
                        }}
                      >
                        ▼
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Dropdown Menu */}
                  {showTimePeriodDropdown && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 35,
                        right: 0,
                        backgroundColor: BaseColors.dark,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: BaseColors.secondary,
                        minWidth: 120,
                        zIndex: 1000,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 5,
                      }}
                    >
                      {(['24hr', '1week', '1month', '1year', 'lifetime'] as const).map(
                        (period) => (
                          <TouchableOpacity
                            key={period}
                            onPress={() => {
                              console.log('[Dashboard] Period selected:', period);
                              handleTimePeriodChange(period);
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderBottomWidth: period === 'lifetime' ? 0 : 1,
                              borderBottomColor: BaseColors.secondary,
                              backgroundColor:
                                selectedTimePeriod === period
                                  ? BaseColors.primary
                                  : 'transparent',
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  selectedTimePeriod === period
                                    ? BaseColors.light
                                    : BaseColors.othertexts,
                                fontSize: 12,
                                fontWeight:
                                  selectedTimePeriod === period ? 'bold' : 'normal',
                              }}
                            >
                              {getPeriodDisplayName(period)}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                  )}
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
