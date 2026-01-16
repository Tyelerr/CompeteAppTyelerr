import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { supabase } from '../../ApiSupabase/supabase';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface IGiveawayView {
  id: string;
  title: string;
  prize_image_url: string | null;
  prize_value: number | string | null;
  entries_count: number;
  description?: string | null;
  end_at: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
  created_at?: string | null;
  maximum_entries?: number;
}

interface ModalViewGiveawayProps {
  visible: boolean;
  onClose: () => void;
  giveaway: IGiveawayView | null;
  onEnter: (giveaway: IGiveawayView) => void;
}

const ModalViewGiveaway: React.FC<ModalViewGiveawayProps> = ({
  visible,
  onClose,
  giveaway,
  onEnter,
}) => {
  const [userEntryCount, setUserEntryCount] = useState<number>(0);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);

  // Fetch user's entry status when modal opens
  useEffect(() => {
    if (visible && giveaway) {
      fetchUserEntryStatus();
    }
  }, [visible, giveaway]);

  const fetchUserEntryStatus = async () => {
    if (!giveaway) return;

    setLoadingEntries(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        setUserEntryCount(0);
        return;
      }

      // Check if user has entered this giveaway
      const { data, error } = await supabase
        .from('giveaway_entries')
        .select('id')
        .eq('giveaway_id', giveaway.id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user entries:', error);
        setUserEntryCount(0);
      } else {
        setUserEntryCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Exception fetching user entries:', error);
      setUserEntryCount(0);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleEntriesClick = () => {
    if (loadingEntries) return;

    const maxEntries = giveaway?.maximum_entries || 500;
    Alert.alert(
      'Entry Information',
      `Your Entries: ${userEntryCount}\nTotal Entries: ${
        giveaway?.entries_count || 0
      } / ${maxEntries}`,
      [{ text: 'OK' }],
    );
  };

  if (!giveaway) return null;

  const prize = Number(giveaway.prize_value || 0);

  // Check if giveaway is full
  const maxEntries = giveaway.maximum_entries || 500;
  const isGiveawayFull = giveaway.entries_count >= maxEntries;

  const handleEnter = () => {
    if (isGiveawayFull) {
      Alert.alert(
        'Giveaway Full',
        'This giveaway has reached its maximum number of entries.',
        [{ text: 'OK' }],
      );
      return;
    }
    onEnter(giveaway);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? 54 : 24,
          paddingHorizontal: 16,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: BaseColors.PanelBorderColor,
          backgroundColor: '#0c0c0c',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
          Giveaway Details
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#0c0c0c' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {!!giveaway.prize_image_url && (
          <Image
            source={{ uri: giveaway.prize_image_url }}
            style={{
              width: '100%',
              height: 250,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              marginBottom: 16,
            }}
            resizeMode="contain"
          />
        )}

        <Text
          style={{
            color: 'white',
            fontWeight: '800',
            fontSize: 24,
            marginBottom: 8,
          }}
        >
          {giveaway.title}
        </Text>

        <Text
          style={{
            color: '#0080FF',
            fontWeight: '900',
            fontSize: 20,
            marginBottom: 16,
          }}
        >
          ${prize} Value
        </Text>

        {!!giveaway.description && (
          <>
            <Text
              style={{ color: '#9ca3af', fontWeight: '600', marginBottom: 6 }}
            >
              Description
            </Text>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 16 }}>
              {giveaway.description}
            </Text>
          </>
        )}

        <TouchableOpacity
          onPress={handleEntriesClick}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            padding: 12,
            backgroundColor: BaseColors.dark,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: BaseColors.secondary,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={{ color: '#9ca3af', fontWeight: '600' }}>
                Entries
              </Text>
              <Icon
                name="info-outline"
                size={16}
                color="#9ca3af"
                style={{ marginLeft: 6 }}
              />
            </View>
            {loadingEntries ? (
              <ActivityIndicator size="small" color={BaseColors.primary} />
            ) : (
              <Text style={{ color: 'white', fontSize: 16 }}>
                {giveaway.entries_count} total entries
                {giveaway.maximum_entries && (
                  <Text style={{ color: '#9ca3af' }}>
                    {' '}
                    / {giveaway.maximum_entries} max
                  </Text>
                )}
              </Text>
            )}
          </View>
          <Icon name="chevron-right" size={24} color={BaseColors.primary} />
        </TouchableOpacity>

        {!!giveaway.created_at && (
          <>
            <Text
              style={{ color: '#9ca3af', fontWeight: '600', marginBottom: 6 }}
            >
              Start Date
            </Text>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 16 }}>
              {new Date(giveaway.created_at).toLocaleDateString()}
            </Text>
          </>
        )}

        {!!giveaway.end_at && (
          <>
            <Text
              style={{ color: '#9ca3af', fontWeight: '600', marginBottom: 6 }}
            >
              End Date
            </Text>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 16 }}>
              {new Date(giveaway.end_at).toLocaleDateString()}
            </Text>
          </>
        )}

        <Text style={{ color: '#9ca3af', fontWeight: '600', marginBottom: 6 }}>
          Status
        </Text>
        <Text style={{ color: 'white', fontSize: 16, marginBottom: 16 }}>
          {giveaway.status.charAt(0).toUpperCase() + giveaway.status.slice(1)}
        </Text>

        {userEntryCount > 0 && (
          <View
            style={{
              backgroundColor: '#022c22',
              borderWidth: 1,
              borderColor: '#34d399',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 14 }}>
              ✓ You have entered this giveaway
            </Text>
            <Text style={{ color: '#9ca3af', marginTop: 4, fontSize: 12 }}>
              Your entries: {userEntryCount}
            </Text>
          </View>
        )}

        <View style={{ height: 16 }} />

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={handleEnter}
              disabled={isGiveawayFull}
              style={{
                backgroundColor: isGiveawayFull
                  ? '#6b7280'
                  : BaseColors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: isGiveawayFull ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {isGiveawayFull ? 'Giveaway Full' : 'Enter Giveaway'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: BaseColors.secondary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default ModalViewGiveaway;
