import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import UIPanel from '../../components/UI/UIPanel';
import ScreenScrollView from '../ScreenScrollView';
import ScreenAdminDropdownNavigation from './ScreenAdminDropdownNavigation';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { StyleZ } from '../../assets/css/styles';
import {
  FetchAllSupportMessages,
  UpdateSupportMessage,
  MarkMessageAsRead,
  GetMessageStatistics,
} from '../../ApiSupabase/CrudMessages';
import {
  ISupportMessage,
  ESupportMessageStatus,
  ESupportMessageType,
} from '../../hooks/InterfacesGlobal';
import { useContextAuth } from '../../context/ContextAuth';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { Ionicons } from '@expo/vector-icons';

type SortOption = 'newest' | 'oldest' | 'status';

export default function ScreenAdminMessages() {
  const { user } = useContextAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ISupportMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ISupportMessage[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] =
    useState<ISupportMessage | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    ESupportMessageStatus | 'unread' | ''
  >('');
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(
    null,
  );

  // Enhanced features state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(
    new Set(),
  );
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const loadMessages = async () => {
    try {
      setLoading(true);

      // Load statistics
      const statsResult = await GetMessageStatistics();
      if (statsResult.success) {
        setStatistics(statsResult.data);
      }

      // Load all messages (we'll filter client-side for better UX)
      const result = await FetchAllSupportMessages();

      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        console.error('Failed to load messages:', result.error);
        Alert.alert('Error', 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'An error occurred while loading messages');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort messages
  useEffect(() => {
    let filtered = [...messages];

    // Apply status filter
    if (statusFilter === 'unread') {
      filtered = filtered.filter((msg) => !msg.is_read);
    } else if (statusFilter) {
      filtered = filtered.filter((msg) => msg.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (msg) =>
          msg.user_name?.toLowerCase().includes(query) ||
          msg.user_email.toLowerCase().includes(query) ||
          msg.message_content.toLowerCase().includes(query) ||
          msg.message_type.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case 'status':
          const statusOrder = { pending: 0, in_progress: 1, resolved: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'newest':
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    setFilteredMessages(filtered);
  }, [messages, statusFilter, searchQuery, sortOption]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      const result = await MarkMessageAsRead(messageId);
      if (result.success) {
        await loadMessages(); // Refresh the list
      } else {
        Alert.alert('Error', 'Failed to mark message as read');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      Alert.alert('Error', 'An error occurred');
    }
  };

  const handleUpdateStatus = async (
    messageId: number,
    status: ESupportMessageStatus,
  ) => {
    try {
      const result = await UpdateSupportMessage(messageId, {
        status,
        is_read: true,
        admin_user_id: user?.id,
      });

      if (result.success) {
        await loadMessages(); // Refresh the list
        Alert.alert('Success', 'Message status updated');
      } else {
        Alert.alert('Error', 'Failed to update message status');
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      Alert.alert('Error', 'An error occurred');
    }
  };

  // Bulk actions
  const handleBulkStatusUpdate = async (status: ESupportMessageStatus) => {
    if (selectedMessages.size === 0) {
      Alert.alert('Error', 'Please select messages first');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedMessages).map((messageId) =>
        UpdateSupportMessage(messageId, {
          status,
          is_read: true,
          admin_user_id: user?.id,
        }),
      );

      await Promise.all(promises);
      setSelectedMessages(new Set());
      setShowBulkActions(false);
      await loadMessages();
      Alert.alert('Success', `Updated ${selectedMessages.size} messages`);
    } catch (error) {
      console.error('Error in bulk update:', error);
      Alert.alert('Error', 'Failed to update some messages');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleMessageSelection = (messageId: number) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllVisible = () => {
    const allIds = new Set(filteredMessages.map((msg) => msg.id));
    setSelectedMessages(allIds);
    setShowBulkActions(allIds.size > 0);
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setShowBulkActions(false);
  };

  const handleSendResponse = async () => {
    if (!selectedMessage || !adminResponse.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    try {
      const result = await UpdateSupportMessage(selectedMessage.id, {
        admin_response: adminResponse.trim(),
        status: ESupportMessageStatus.Resolved,
        is_read: true,
        admin_user_id: user?.id,
      });

      if (result.success) {
        setAdminResponse('');
        setSelectedMessage(null);
        await loadMessages();
        Alert.alert('Success', 'Response sent successfully');
      } else {
        Alert.alert('Error', 'Failed to send response');
      }
    } catch (error) {
      console.error('Error sending response:', error);
      Alert.alert('Error', 'An error occurred');
    }
  };

  const getStatusColor = (status: ESupportMessageStatus) => {
    switch (status) {
      case ESupportMessageStatus.Pending:
        return '#f97316'; // More distinct orange
      case ESupportMessageStatus.InProgress:
        return '#3b82f6'; // blue
      case ESupportMessageStatus.Resolved:
        return '#10b981'; // green
      default:
        return BaseColors.othertexts;
    }
  };

  const getMessageTypeColor = (type: ESupportMessageType) => {
    switch (type) {
      case ESupportMessageType.TechnicalSupport:
        return '#ef4444'; // red
      case ESupportMessageType.TournamentInquiry:
        return '#8b5cf6'; // purple
      case ESupportMessageType.AccountIssue:
        return '#f59e0b'; // amber
      case ESupportMessageType.FeedbackSuggestion:
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const getMessageTypeIcon = (type: ESupportMessageType) => {
    switch (type) {
      case ESupportMessageType.GeneralQuestion:
        return 'help-circle-outline';
      case ESupportMessageType.TechnicalSupport:
        return 'build-outline';
      case ESupportMessageType.TournamentInquiry:
        return 'trophy-outline';
      case ESupportMessageType.AccountIssue:
        return 'person-circle-outline';
      case ESupportMessageType.FeedbackSuggestion:
        return 'chatbubble-outline';
      default:
        return 'mail-outline';
    }
  };

  const getStatusIcon = (status: ESupportMessageStatus, isUnread: boolean) => {
    if (isUnread) return '🔔';
    switch (status) {
      case ESupportMessageStatus.Pending:
        return '⏳';
      case ESupportMessageStatus.InProgress:
        return '🔄';
      case ESupportMessageStatus.Resolved:
        return '✅';
      default:
        return '📧';
    }
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateFull = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleExpanded = (messageId: number) => {
    setExpandedMessageId(expandedMessageId === messageId ? null : messageId);
  };

  // Generate mock analytics data (in real app, this would come from API)
  const generateAnalyticsData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayMessages = messages.filter((msg) => {
        const msgDate = new Date(msg.created_at);
        return msgDate.toDateString() === date.toDateString();
      }).length;
      days.push({ day: date.getDate(), count: dayMessages });
    }
    return days;
  };

  const renderAnalyticsTrendline = () => {
    const data = generateAnalyticsData();
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const screenWidth = Dimensions.get('window').width - 60;
    const chartWidth = screenWidth - 40;

    return (
      <View style={{ marginTop: 15 }}>
        <Text
          style={[
            StyleZ.h5,
            { marginBottom: 10, color: BaseColors.othertexts },
          ]}
        >
          📈 Last 7 Days Activity
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: 60,
            backgroundColor: BaseColors.secondary,
            borderRadius: 8,
            padding: 10,
            justifyContent: 'space-between',
          }}
        >
          {data.map((item, index) => (
            <View key={index} style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  backgroundColor: BaseColors.primary,
                  width: Math.max(chartWidth / 7 - 4, 8),
                  height: Math.max((item.count / maxCount) * 40, 2),
                  borderRadius: 2,
                  marginBottom: 4,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: BaseColors.othertexts,
                  textAlign: 'center',
                }}
              >
                {item.day}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  useEffect(() => {
    loadMessages();
  }, []);

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

        {/* Messages Management Title */}
        <Text
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: '800',
            marginTop: BasePaddingsMargins.m10,
            marginBottom: BasePaddingsMargins.m15,
          }}
        >
          📨 Messages Dashboard
        </Text>

        {/* Enhanced Statistics Panel - 2x2 Grid */}
        {statistics && (
          <UIPanel>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={[StyleZ.h3, { color: 'white' }]}>
                Message Overview
              </Text>
              <Text style={{ color: BaseColors.othertexts, fontSize: 12 }}>
                {getRelativeTime(new Date().toISOString())}
              </Text>
            </View>

            {/* 2x2 Grid Layout */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: BaseColors.secondary,
                  padding: 15,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: 'transparent',
                }}
              >
                <Text
                  style={[StyleZ.h2, { color: 'white', fontWeight: 'bold' }]}
                >
                  {statistics.total}
                </Text>
                <Text
                  style={[
                    StyleZ.p,
                    { color: BaseColors.othertexts, fontSize: 12 },
                  ]}
                >
                  Total Messages
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  padding: 15,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#ef4444',
                  shadowColor: '#dc2626',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 4 }}>🔔</Text>
                  <Text
                    style={[StyleZ.h2, { color: 'white', fontWeight: 'bold' }]}
                  >
                    {statistics.unread}
                  </Text>
                </View>
                <Text
                  style={[
                    StyleZ.p,
                    { color: 'white', fontSize: 12, fontWeight: '600' },
                  ]}
                >
                  Unread
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#ea580c',
                  padding: 15,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#f97316',
                  shadowColor: '#ea580c',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 4 }}>⏳</Text>
                  <Text
                    style={[StyleZ.h2, { color: 'white', fontWeight: 'bold' }]}
                  >
                    {statistics.pending}
                  </Text>
                </View>
                <Text
                  style={[
                    StyleZ.p,
                    { color: 'white', fontSize: 12, fontWeight: '600' },
                  ]}
                >
                  Pending
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: '#2563eb',
                  padding: 15,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 4 }}>🔄</Text>
                  <Text
                    style={[StyleZ.h2, { color: 'white', fontWeight: 'bold' }]}
                  >
                    {statistics.in_progress}
                  </Text>
                </View>
                <Text
                  style={[
                    StyleZ.p,
                    { color: 'white', fontSize: 12, fontWeight: '600' },
                  ]}
                >
                  In Progress
                </Text>
              </View>
            </View>

            {/* Analytics Trendline */}
            {renderAnalyticsTrendline()}
          </UIPanel>
        )}

        {/* Search and Filter Panel */}
        <UIPanel>
          {/* Search Bar */}
          <View style={{ marginBottom: 15 }}>
            <Text style={[StyleZ.h5, { color: 'white', marginBottom: 8 }]}>
              🔍 Search Messages
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: BaseColors.secondary,
                borderRadius: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: BaseColors.PanelBorderColor,
              }}
            >
              <Ionicons name="search" size={18} color={BaseColors.othertexts} />
              <TextInput
                style={{
                  flex: 1,
                  color: 'white',
                  fontSize: TextsSizes.p,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                }}
                placeholder="Search by user, email, or message content..."
                placeholderTextColor={BaseColors.othertexts}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={BaseColors.othertexts}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Status Filter Chips */}
          <View style={{ marginBottom: 15 }}>
            <Text style={[StyleZ.h5, { color: 'white', marginBottom: 8 }]}>
              📊 Filter by Status
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: 'All', value: '', count: statistics?.total || 0 },
                  {
                    label: 'Unread',
                    value: 'unread',
                    count: statistics?.unread || 0,
                  },
                  {
                    label: 'Pending',
                    value: ESupportMessageStatus.Pending,
                    count: statistics?.pending || 0,
                  },
                  {
                    label: 'In Progress',
                    value: ESupportMessageStatus.InProgress,
                    count: statistics?.in_progress || 0,
                  },
                  {
                    label: 'Resolved',
                    value: ESupportMessageStatus.Resolved,
                    count: statistics?.resolved || 0,
                  },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() =>
                      setStatusFilter(
                        filter.value as ESupportMessageStatus | 'unread' | '',
                      )
                    }
                    style={{
                      backgroundColor:
                        statusFilter === filter.value
                          ? BaseColors.primary
                          : BaseColors.secondary,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor:
                        statusFilter === filter.value
                          ? BaseColors.primary
                          : BaseColors.PanelBorderColor,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color:
                          statusFilter === filter.value
                            ? 'white'
                            : BaseColors.othertexts,
                        fontSize: 13,
                        fontWeight:
                          statusFilter === filter.value ? '600' : '400',
                        marginRight: 4,
                      }}
                    >
                      {filter.label}
                    </Text>
                    <View
                      style={{
                        backgroundColor:
                          statusFilter === filter.value
                            ? 'rgba(255,255,255,0.2)'
                            : BaseColors.othertexts,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 10,
                        minWidth: 20,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color:
                            statusFilter === filter.value
                              ? 'white'
                              : BaseColors.secondary,
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      >
                        {filter.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={{ marginBottom: 15 }}>
            <Text style={[StyleZ.h5, { color: 'white', marginBottom: 8 }]}>
              🔄 Sort Messages
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'Newest First', value: 'newest' as SortOption },
                { label: 'Oldest First', value: 'oldest' as SortOption },
                { label: 'By Status', value: 'status' as SortOption },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.value}
                  onPress={() => setSortOption(sort.value)}
                  style={{
                    backgroundColor:
                      sortOption === sort.value
                        ? BaseColors.primary
                        : BaseColors.secondary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor:
                      sortOption === sort.value
                        ? BaseColors.primary
                        : BaseColors.PanelBorderColor,
                  }}
                >
                  <Text
                    style={{
                      color:
                        sortOption === sort.value
                          ? 'white'
                          : BaseColors.othertexts,
                      fontSize: 12,
                      fontWeight: sortOption === sort.value ? '600' : '400',
                    }}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bulk Actions */}
          {showBulkActions && (
            <View
              style={{
                backgroundColor: BaseColors.secondary,
                padding: 12,
                borderRadius: 8,
                marginBottom: 15,
                borderWidth: 1,
                borderColor: BaseColors.primary,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={[StyleZ.h5, { color: 'white' }]}>
                  📋 Bulk Actions ({selectedMessages.size} selected)
                </Text>
                <TouchableOpacity onPress={clearSelection}>
                  <Text style={{ color: BaseColors.primary, fontSize: 12 }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={() =>
                    handleBulkStatusUpdate(ESupportMessageStatus.InProgress)
                  }
                  disabled={bulkActionLoading}
                  style={{
                    backgroundColor: '#f59e0b',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 4,
                    opacity: bulkActionLoading ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    Mark In Progress
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    handleBulkStatusUpdate(ESupportMessageStatus.Resolved)
                  }
                  disabled={bulkActionLoading}
                  style={{
                    backgroundColor: '#10b981',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 4,
                    opacity: bulkActionLoading ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    Mark Resolved
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={selectAllVisible}
                  style={{
                    backgroundColor: BaseColors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    Select All Visible
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </UIPanel>

        {/* Messages List - Enhanced Cards */}
        {loading ? (
          <UIPanel>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                Loading messages...
              </Text>
            </View>
          </UIPanel>
        ) : filteredMessages.length === 0 ? (
          <UIPanel>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text
                style={[
                  StyleZ.h4,
                  { color: BaseColors.othertexts, marginBottom: 8 },
                ]}
              >
                📭 No messages found
              </Text>
              <Text
                style={[
                  StyleZ.p,
                  { color: BaseColors.othertexts, textAlign: 'center' },
                ]}
              >
                {searchQuery || statusFilter
                  ? 'Try adjusting your filters'
                  : 'No support messages yet'}
              </Text>
            </View>
          </UIPanel>
        ) : (
          filteredMessages.map((message) => (
            <UIPanel key={message.id} style={{ marginBottom: 10 }}>
              {/* Message Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                {/* Bulk Selection Checkbox */}
                <TouchableOpacity
                  onPress={() => toggleMessageSelection(message.id)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: selectedMessages.has(message.id)
                      ? BaseColors.primary
                      : BaseColors.othertexts,
                    backgroundColor: selectedMessages.has(message.id)
                      ? BaseColors.primary
                      : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {selectedMessages.has(message.id) && (
                    <Ionicons name="checkmark" size={12} color="white" />
                  )}
                </TouchableOpacity>

                {/* User Avatar */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: BaseColors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}
                  >
                    {getUserInitials(message.user_name, message.user_email)}
                  </Text>
                </View>

                {/* Message Info */}
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={[StyleZ.h5, { color: 'white', marginRight: 8 }]}
                    >
                      {message.user_name || message.user_email}
                    </Text>
                    {!message.is_read && (
                      <View
                        style={{
                          backgroundColor: '#ef4444',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 10,
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
                          NEW
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={getMessageTypeIcon(message.message_type)}
                      size={14}
                      color={getMessageTypeColor(message.message_type)}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        StyleZ.p,
                        { color: BaseColors.othertexts, fontSize: 12 },
                      ]}
                    >
                      {message.message_type}
                    </Text>
                  </View>
                </View>

                {/* Status and Time */}
                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={{
                      backgroundColor: getStatusColor(message.status),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {getStatusIcon(message.status, !message.is_read)}{' '}
                      {message.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.othertexts, fontSize: 11 },
                    ]}
                  >
                    {getRelativeTime(message.created_at)}
                  </Text>
                </View>
              </View>

              {/* Message Preview */}
              <TouchableOpacity
                onPress={() => toggleExpanded(message.id)}
                style={{
                  backgroundColor: BaseColors.secondary,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={[StyleZ.p, { color: 'white', lineHeight: 20 }]}
                  numberOfLines={
                    expandedMessageId === message.id ? undefined : 2
                  }
                >
                  {message.message_content}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.othertexts, fontSize: 11 },
                    ]}
                  >
                    {formatDateFull(message.created_at)}
                  </Text>
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.primary, fontSize: 12 },
                    ]}
                  >
                    {expandedMessageId === message.id
                      ? 'Show Less ▲'
                      : 'Show More ▼'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Expanded Details */}
              {expandedMessageId === message.id && (
                <View style={{ marginBottom: 12 }}>
                  {/* Tournament ID if present */}
                  {message.tournament_id && (
                    <View
                      style={{
                        backgroundColor: '#8b5cf6',
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={[StyleZ.p, { color: 'white', fontSize: 12 }]}
                      >
                        🏆 Tournament ID: {message.tournament_id}
                      </Text>
                    </View>
                  )}

                  {/* Admin Response if exists */}
                  {message.admin_response && (
                    <View
                      style={{
                        backgroundColor: '#10b981',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={[StyleZ.h5, { color: 'white', marginBottom: 6 }]}
                      >
                        💬 Admin Response:
                      </Text>
                      <Text style={[StyleZ.p, { color: 'white' }]}>
                        {message.admin_response}
                      </Text>
                      {message.responded_at && (
                        <Text
                          style={[
                            StyleZ.p,
                            {
                              fontSize: 11,
                              marginTop: 4,
                              color: 'rgba(255,255,255,0.8)',
                            },
                          ]}
                        >
                          Responded: {formatDateFull(message.responded_at)}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Quick Actions */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {!message.is_read && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#3b82f6',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() => handleMarkAsRead(message.id)}
                  >
                    <Ionicons
                      name="eye"
                      size={14}
                      color="white"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[StyleZ.p, { color: 'white', fontSize: 12 }]}>
                      Mark Read
                    </Text>
                  </TouchableOpacity>
                )}

                {message.status === ESupportMessageStatus.Pending && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#f59e0b',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() =>
                      handleUpdateStatus(
                        message.id,
                        ESupportMessageStatus.InProgress,
                      )
                    }
                  >
                    <Ionicons
                      name="play"
                      size={14}
                      color="white"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[StyleZ.p, { color: 'white', fontSize: 12 }]}>
                      Start Progress
                    </Text>
                  </TouchableOpacity>
                )}

                {message.status !== ESupportMessageStatus.Resolved && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#10b981',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() =>
                      handleUpdateStatus(
                        message.id,
                        ESupportMessageStatus.Resolved,
                      )
                    }
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="white"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[StyleZ.p, { color: 'white', fontSize: 12 }]}>
                      Resolve
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: BaseColors.secondary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: BaseColors.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={() => setSelectedMessage(message)}
                >
                  <Ionicons
                    name="chatbubble"
                    size={14}
                    color={BaseColors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.primary, fontSize: 12 },
                    ]}
                  >
                    Respond
                  </Text>
                </TouchableOpacity>
              </View>
            </UIPanel>
          ))
        )}

        {/* Response Modal/Panel */}
        {selectedMessage && (
          <UIPanel
            style={{
              borderWidth: 2,
              borderColor: BaseColors.primary,
              backgroundColor: BaseColors.secondary,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={[StyleZ.h3, { color: 'white' }]}>
                💬 Respond to Message
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedMessage(null);
                  setAdminResponse('');
                }}
                style={{
                  backgroundColor: BaseColors.othertexts,
                  borderRadius: 15,
                  width: 30,
                  height: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View
              style={{
                backgroundColor: BaseColors.primary,
                padding: 12,
                borderRadius: 8,
                marginBottom: 15,
              }}
            >
              <Text style={[StyleZ.h5, { color: 'white', marginBottom: 4 }]}>
                From: {selectedMessage.user_name || selectedMessage.user_email}
              </Text>
              <Text
                style={[
                  StyleZ.p,
                  { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
                ]}
              >
                Type: {selectedMessage.message_type} •{' '}
                {formatDateFull(selectedMessage.created_at)}
              </Text>
            </View>

            {/* Original Message */}
            <View
              style={{
                backgroundColor: BaseColors.backgroundColor,
                padding: 12,
                borderRadius: 8,
                marginBottom: 15,
                borderLeftWidth: 4,
                borderLeftColor: BaseColors.primary,
              }}
            >
              <Text style={[StyleZ.h5, { color: 'white', marginBottom: 8 }]}>
                Original Message:
              </Text>
              <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                {selectedMessage.message_content}
              </Text>
            </View>

            {/* Response Input */}
            <LFInput
              typeInput="textarea"
              label="Admin Response"
              value={adminResponse}
              placeholder="Enter your response to the user..."
              onChangeText={setAdminResponse}
            />

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                marginTop: BasePaddingsMargins.m10,
              }}
            >
              <View style={{ flex: 1 }}>
                <LFButton
                  type="primary"
                  label="Send Response & Resolve"
                  onPress={handleSendResponse}
                />
              </View>
              <View style={{ flex: 1 }}>
                <LFButton
                  type="secondary"
                  label="Cancel"
                  onPress={() => {
                    setSelectedMessage(null);
                    setAdminResponse('');
                  }}
                />
              </View>
            </View>
          </UIPanel>
        )}

        {/* Results Summary */}
        {!loading && (
          <UIPanel>
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text
                style={[
                  StyleZ.p,
                  { color: BaseColors.othertexts, textAlign: 'center' },
                ]}
              >
                Showing {filteredMessages.length} of {messages.length} messages
                {searchQuery && ` • Search: "${searchQuery}"`}
                {statusFilter && ` • Filter: ${statusFilter}`}
              </Text>
            </View>
          </UIPanel>
        )}
      </View>
    </ScreenScrollView>
  );
}
