import React, { useState, useEffect } from 'react';
import { View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import ScreenScrollView from '../ScreenScrollView';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { StyleZ } from '../../assets/css/styles';
import { FetchUserSupportMessages } from '../../ApiSupabase/CrudMessages';
import {
  ISupportMessage,
  ESupportMessageStatus,
  ESupportMessageType,
} from '../../hooks/InterfacesGlobal';
import { useContextAuth } from '../../context/ContextAuth';
import { Ionicons } from '@expo/vector-icons';

export default function SupportMessagesTab() {
  const { user } = useContextAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<ISupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(
    null,
  );

  const loadMessages = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await FetchUserSupportMessages(user.id);

      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        console.error('Failed to load messages:', result.error);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const getStatusColor = (status: ESupportMessageStatus) => {
    switch (status) {
      case ESupportMessageStatus.Pending:
        return '#f97316'; // orange
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

  const getStatusIcon = (status: ESupportMessageStatus) => {
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

  const toggleExpanded = (messageId: number) => {
    setExpandedMessageId(expandedMessageId === messageId ? null : messageId);
  };

  useEffect(() => {
    loadMessages();
  }, [user?.id]);

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
        {/* Messages List */}
        {loading ? (
          <UIPanel>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={[StyleZ.p, { color: BaseColors.othertexts }]}>
                Loading your messages...
              </Text>
            </View>
          </UIPanel>
        ) : messages.length === 0 ? (
          <UIPanel>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text
                style={[
                  StyleZ.h4,
                  { color: BaseColors.othertexts, marginBottom: 8 },
                ]}
              >
                📭 No messages yet
              </Text>
              <Text
                style={[
                  StyleZ.p,
                  { color: BaseColors.othertexts, textAlign: 'center' },
                ]}
              >
                You haven't sent any support messages yet. When you do, they'll
                appear here along with admin responses.
              </Text>
            </View>
          </UIPanel>
        ) : (
          messages.map((message) => (
            <UIPanel key={message.id} style={{ marginBottom: 10 }}>
              {/* Message Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                {/* Message Type Icon */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: getMessageTypeColor(message.message_type),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={getMessageTypeIcon(message.message_type)}
                    size={20}
                    color="white"
                  />
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
                      {message.message_type}
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
                          NEW REPLY
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.othertexts, fontSize: 12 },
                    ]}
                  >
                    Sent {getRelativeTime(message.created_at)}
                  </Text>
                </View>

                {/* Status */}
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
                      {getStatusIcon(message.status)}{' '}
                      {message.status.toUpperCase()}
                    </Text>
                  </View>
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
                <Text style={[StyleZ.h5, { color: 'white', marginBottom: 6 }]}>
                  Your Message:
                </Text>
                <Text
                  style={[StyleZ.p, { color: 'white', lineHeight: 20 }]}
                  numberOfLines={
                    expandedMessageId === message.id ? undefined : 3
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
                  <Text style={[StyleZ.p, { color: 'white', fontSize: 12 }]}>
                    🏆 Related to Tournament ID: {message.tournament_id}
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
                    borderLeftWidth: 4,
                    borderLeftColor: '#059669',
                  }}
                >
                  <Text
                    style={[StyleZ.h5, { color: 'white', marginBottom: 6 }]}
                  >
                    💬 Admin Response:
                  </Text>
                  <Text style={[StyleZ.p, { color: 'white', lineHeight: 20 }]}>
                    {message.admin_response}
                  </Text>
                  {message.responded_at && (
                    <Text
                      style={[
                        StyleZ.p,
                        {
                          fontSize: 11,
                          marginTop: 6,
                          color: 'rgba(255,255,255,0.8)',
                        },
                      ]}
                    >
                      Responded: {formatDateFull(message.responded_at)}
                    </Text>
                  )}
                </View>
              )}
            </UIPanel>
          ))
        )}
      </View>
    </ScreenScrollView>
  );
}
