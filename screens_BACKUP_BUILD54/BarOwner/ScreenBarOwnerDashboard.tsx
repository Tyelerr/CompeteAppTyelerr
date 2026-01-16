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
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import { useContextAuth } from '../../context/ContextAuth';
import {
  FetchBarOwnerAnalytics,
  FetchBarOwnerDirectors,
  IBarOwnerAnalytics,
} from '../../ApiSupabase/CrudBarOwner';
import { GetVenueTournamentViewStatsByPeriod } from '../../ApiSupabase/CrudTournamentViews';
import {
  GetVenueTournamentLikesComprehensiveStats,
  GetVenueTournamentLikesStatsByPeriod,
} from '../../ApiSupabase/CrudTournament';
import { ICAUserData, EUserRole } from '../../hooks/InterfacesGlobal';
import { StyleZ } from '../../assets/css/styles';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { FetchUsersV2, UpdateProfile } from '../../ApiSupabase/CrudUser';
import {
  assignTournamentDirectorToVenue,
  removeTournamentDirectorFromVenue,
} from '../../ApiSupabase/CrudVenues';
import { FetchBarOwnerVenues } from '../../ApiSupabase/CrudBarOwner';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LBButtonsGroup from '../../components/LoginForms/Button/LBButtonsGroup';

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
  const [removingDirector, setRemovingDirector] = useState<number | null>(null);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [directorToRemove, setDirectorToRemove] = useState<ICAUserData | null>(
    null,
  );

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
          loadTournamentLikesStats(venuesResult.data);
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

  const loadTournamentViewStats = async (
    venuesList: any[],
    period:
      | '24hr'
      | '1week'
      | '1month'
      | '1year'
      | 'lifetime' = selectedTimePeriod,
  ) => {
    try {
      let totalViewsCount = 0;
      const statsPromises = venuesList.map(async (venue) => {
        const { totalViews, error } = await GetVenueTournamentViewStatsByPeriod(
          venue.id,
          period,
        );
        if (!error) {
          totalViewsCount += totalViews || 0;
          return { venue: venue.venue, totalViews: totalViews || 0 };
        }
        return { venue: venue.venue, totalViews: 0 };
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
    period:
      | '24hr'
      | '1week'
      | '1month'
      | '1year'
      | 'lifetime' = selectedTimePeriod,
  ) => {
    try {
      let totalCurrentLikesCount = 0;
      let totalHistoricalLikesCount = 0;
      let totalPeriodLikesCount = 0;

      const likesStatsPromises = venuesList.map(async (venue) => {
        const stats = await GetVenueTournamentLikesStatsByPeriod(
          venue.id,
          period,
        );
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
          };
        }
        return {
          venue: venue.venue,
          currentLikes: 0,
          historicalLikes: 0,
          periodLikes: 0,
          uniqueUsers: 0,
        };
      });

      const results = await Promise.all(likesStatsPromises);
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
    if (venues && venues.length > 0) {
      // Reload BOTH likes and view stats when period changes
      await Promise.all([
        loadTournamentLikesStats(venues, period),
        loadTournamentViewStats(venues, period),
      ]);
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

  const confirmRemoveTournamentDirector = (director: ICAUserData) => {
    setDirectorToRemove(director);
    setShowRemoveConfirmModal(true);
  };

  const handleRemoveTournamentDirector = async () => {
    if (!directorToRemove || removingDirector || !user?.id_auto) return;

    setRemovingDirector(directorToRemove.id_auto);
    setShowRemoveConfirmModal(false);

    try {
      // Find ONLY the bar owner's venues where this director is assigned
      // Filter by both td_id matching AND venues belonging to this bar owner
      const barOwnerVenuesWithThisDirector = venues.filter(
        (venue) => venue.td_id === directorToRemove.id_auto,
      );

      if (barOwnerVenuesWithThisDirector.length === 0) {
        Alert.alert(
          'Error',
          'This tournament director is not assigned to any of your venues',
        );
        setRemovingDirector(null);
        setDirectorToRemove(null);
        return;
      }

      // Remove TD from ONLY the bar owner's venues
      const removePromises = barOwnerVenuesWithThisDirector.map((venue) =>
        removeTournamentDirectorFromVenue(venue.id),
      );

      const results = await Promise.all(removePromises);

      // Check if all removals were successful
      const allSuccessful = results.every((result) => result.success);

      if (allSuccessful) {
        const venueNames = barOwnerVenuesWithThisDirector
          .map((v) => v.venue)
          .join(', ');
        Alert.alert(
          'Success',
          `Successfully removed ${
            directorToRemove.user_name || directorToRemove.name
          } as Tournament Director from your venue${
            barOwnerVenuesWithThisDirector.length > 1 ? 's' : ''
          }: ${venueNames}`,
        );

        // Refresh the dashboard data
        loadDashboardData();
        setShowDirectorsModal(true);
      } else {
        const failedResults = results.filter((result) => !result.success);
        throw new Error(
          failedResults[0]?.error || 'Failed to remove tournament director',
        );
      }
    } catch (error) {
      console.error('Error removing tournament director:', error);
      Alert.alert(
        'Error',
        `Failed to remove tournament director: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setRemovingDirector(null);
      setDirectorToRemove(null);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmModal(false);
    setDirectorToRemove(null);
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
    <ScrollView
      style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}
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

        {/* Time Period Selector - Above Venue Performance */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: BasePaddingsMargins.m15,
            paddingHorizontal: 8,
            zIndex: 2000,
            position: 'relative',
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
            Time Period Filter
          </Text>

          <View style={{ width: 140, position: 'relative', zIndex: 2000 }}>
            {/* Custom Dropdown Button */}
            <TouchableOpacity
              onPress={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
              style={{
                backgroundColor: BaseColors.primary,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: BaseColors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minWidth: 140,
              }}
            >
              <Text
                style={{
                  color: BaseColors.light,
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              >
                {selectedTimePeriod === '24hr'
                  ? '24 Hours'
                  : selectedTimePeriod === '1week'
                  ? '1 Week'
                  : selectedTimePeriod === '1month'
                  ? '1 Month'
                  : selectedTimePeriod === '1year'
                  ? '1 Year'
                  : 'Lifetime'}
              </Text>
              <Ionicons
                name={showTimePeriodDropdown ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={BaseColors.light}
              />
            </TouchableOpacity>

            {/* Custom Dropdown Options */}
            {showTimePeriodDropdown && (
              <View
                style={{
                  position: 'absolute',
                  top: 40,
                  left: 0,
                  right: 0,
                  backgroundColor: BaseColors.dark,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: BaseColors.secondary,
                  zIndex: 3000,
                  elevation: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                }}
              >
                {[
                  { label: '24 Hours', value: '24hr' },
                  { label: '1 Week', value: '1week' },
                  { label: '1 Month', value: '1month' },
                  { label: '1 Year', value: '1year' },
                  { label: 'Lifetime', value: 'lifetime' },
                ].map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      handleTimePeriodChange(option.value as any);
                      setShowTimePeriodDropdown(false);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: index < 4 ? 1 : 0,
                      borderBottomColor: BaseColors.secondary,
                      backgroundColor:
                        selectedTimePeriod === option.value
                          ? BaseColors.primary + '20'
                          : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        color:
                          selectedTimePeriod === option.value
                            ? BaseColors.primary
                            : BaseColors.light,
                        fontSize: 12,
                        fontWeight:
                          selectedTimePeriod === option.value
                            ? 'bold'
                            : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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
                  Likes
                </Text>
                <Text style={[StyleZ.h3, { color: '#ec4899' }]}>
                  {selectedTimePeriod === 'lifetime'
                    ? totalHistoricalLikes
                    : periodLikes}
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
                    paddingVertical: 30,
                    backgroundColor: BaseColors.dark,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: BaseColors.secondary,
                  }}
                >
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
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
                      {
                        color: BaseColors.othertexts,
                        textAlign: 'center',
                        paddingHorizontal: 20,
                      },
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
                  const isRemoving = removingDirector === director.id_auto;

                  return (
                    <View
                      key={director.id}
                      style={{
                        backgroundColor: BaseColors.dark,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: BaseColors.secondary,
                        opacity: isRemoving ? 0.5 : 1,
                      }}
                    >
                      {/* Director Info Row */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 10,
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
                              {
                                color: BaseColors.light,
                                marginBottom: 2,
                                fontSize: 15,
                              },
                            ]}
                          >
                            {director.name || director.user_name}
                          </Text>
                          <Text
                            style={[
                              StyleZ.p,
                              { color: BaseColors.othertexts, fontSize: 11 },
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
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 3,
                                marginRight: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: 'white',
                                  fontSize: 9,
                                  fontWeight: 'bold',
                                }}
                              >
                                Active
                              </Text>
                            </View>
                            <Text
                              style={[
                                StyleZ.p,
                                { color: BaseColors.othertexts, fontSize: 9 },
                              ]}
                            >
                              Managing tournaments
                            </Text>
                          </View>
                        </View>

                        {/* Trash Can Icon */}
                        <TouchableOpacity
                          onPress={() =>
                            confirmRemoveTournamentDirector(director)
                          }
                          disabled={isRemoving}
                          style={{
                            backgroundColor: '#dc2626',
                            borderRadius: 6,
                            width: 36,
                            height: 36,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: 8,
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="white"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Action Buttons Row */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: '#374151',
                            paddingVertical: 8,
                            borderRadius: 6,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#4b5563',
                          }}
                        >
                          <Text
                            style={{
                              color: 'white',
                              fontSize: 13,
                              fontWeight: '600',
                            }}
                          >
                            Contact
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={{ marginTop: 16 }}>
              <LBButtonsGroup
                buttons={[
                  <LFButton
                    label="Add Tournament Director"
                    type="dark"
                    onPress={() => {
                      setShowDirectorsModal(false);
                      setShowAddDirectorModal(true);
                    }}
                  />,
                  <LFButton
                    label="Cancel"
                    type="danger"
                    onPress={() => setShowDirectorsModal(false)}
                  />,
                ]}
              />
            </View>
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
                        backgroundColor: isAssigning ? '#1e3a8a' : '#16171a',
                        marginBottom: 8,
                        borderRadius: 8,
                        opacity: isAssigning ? 0.7 : 1,
                      }}
                    >
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontWeight: '700' }}>
                            {capitalizeProfileName(item.user_name || item.name)}
                          </Text>
                          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                            ID: {formatUserId(item.id_auto)}
                          </Text>
                          {item.email && (
                            <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                              {item.email}
                            </Text>
                          )}
                        </View>
                        {isAssigning && (
                          <View style={{ marginLeft: 8 }}>
                            <Text
                              style={{
                                color: '#3b82f6',
                                fontSize: 12,
                                fontWeight: '700',
                              }}
                            >
                              Assigning...
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : search.trim().length > 0 && !searchLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                    No users found matching "{search}"
                  </Text>
                </View>
              ) : null}

              {searchLoading && (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                    Searching...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowAddDirectorModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#b91c1c',
                  borderWidth: 1,
                  borderColor: '#7a1f1f',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={handleCancelConfirmation}
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
              Confirm Tournament Director Assignment
            </Text>

            {selectedUserForConfirm && (
              <View style={{ marginBottom: 20, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ color: '#3b82f6', fontWeight: '700' }}>
                    Profile:{' '}
                  </Text>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {capitalizeProfileName(
                      selectedUserForConfirm.user_name ||
                        selectedUserForConfirm.name,
                    )}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <Text style={{ color: '#3b82f6', fontWeight: '700' }}>
                    User ID:{' '}
                  </Text>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {formatUserId(selectedUserForConfirm.id_auto)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ color: '#3b82f6', fontWeight: '700' }}>
                    Venue:{' '}
                  </Text>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {selectedVenue?.venue || 'No venue selected'}
                  </Text>
                </View>

                <Text
                  style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: 'center',
                  }}
                >
                  Please confirm you'd like to add this user as a tournament
                  director for {selectedVenue?.venue || 'your venue'}.
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleConfirmAssignment}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>
                  Confirm Assignment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelConfirmation}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#6b7280',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Venue Selection Modal */}
      <Modal visible={showVenueSelection} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={handleCancelVenueSelection}
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
              Select Venue
            </Text>

            {selectedUserForConfirm && (
              <View style={{ marginBottom: 20, alignItems: 'center' }}>
                <Text
                  style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: 'center',
                    marginBottom: 16,
                  }}
                >
                  Select which venue to assign{' '}
                  {capitalizeProfileName(
                    selectedUserForConfirm.user_name ||
                      selectedUserForConfirm.name,
                  )}{' '}
                  as Tournament Director:
                </Text>

                <ScrollView style={{ maxHeight: 200, width: '100%' }}>
                  {venues.map((venue) => (
                    <TouchableOpacity
                      key={venue.id}
                      onPress={() => handleVenueSelected(venue)}
                      style={{
                        backgroundColor: '#16171a',
                        borderWidth: 1,
                        borderColor: BaseColors.secondary,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: 'white',
                          fontWeight: '700',
                          fontSize: 16,
                          marginBottom: 4,
                        }}
                      >
                        {venue.venue}
                      </Text>
                      <Text
                        style={{
                          color: '#9ca3af',
                          fontSize: 12,
                        }}
                      >
                        {venue.address}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              onPress={handleCancelVenueSelection}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: '#6b7280',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Remove Tournament Director Confirmation Modal */}
      <Modal visible={showRemoveConfirmModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={handleCancelRemove}
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
              Remove Tournament Director
            </Text>

            {directorToRemove && (
              <View style={{ marginBottom: 20, alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: '#dc2626',
                    borderRadius: 50,
                    width: 60,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="trash-outline" size={30} color="white" />
                </View>

                <Text
                  style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    lineHeight: 20,
                    textAlign: 'center',
                    marginBottom: 12,
                  }}
                >
                  Are you sure you want to remove{' '}
                  <Text style={{ color: 'white', fontWeight: '700' }}>
                    {capitalizeProfileName(
                      directorToRemove.user_name || directorToRemove.name,
                    )}
                  </Text>{' '}
                  as a Tournament Director?
                </Text>

                <Text
                  style={{
                    color: '#ef4444',
                    fontSize: 12,
                    lineHeight: 18,
                    textAlign: 'center',
                  }}
                >
                  This will remove them from your venue(s) only.
                </Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LFButton
                  label="Remove Director"
                  type="danger"
                  onPress={handleRemoveTournamentDirector}
                />
              </View>

              <View style={{ flex: 1 }}>
                <LFButton
                  label="Cancel"
                  type="secondary"
                  onPress={handleCancelRemove}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
