import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { supabase } from '../../ApiSupabase/supabase';
import ModalPickWinner from './ModalPickWinner';

interface IGiveawayEdit {
  id: string;
  title: string;
  prizeValue?: number;
  status:
    | 'draft'
    | 'scheduled'
    | 'active'
    | 'paused'
    | 'ended'
    | 'awarded'
    | 'archived';
  endAt?: string;
  description?: string;
  entries_count?: number;
}

interface GiveawayWinner {
  id: string;
  entry_id: string;
  user_id?: string;
  method: string;
  picked_at: string;
  notified: boolean;
  entry_number?: number;
  full_name?: string;
}

interface ModalEditGiveawayProps {
  visible: boolean;
  onClose: () => void;
  giveaway: IGiveawayEdit | null;
  onSave: (updatedGiveaway: IGiveawayEdit) => Promise<void>;
}

const ModalEditGiveaway: React.FC<ModalEditGiveawayProps> = ({
  visible,
  onClose,
  giveaway,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [endAt, setEndAt] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<IGiveawayEdit['status']>('active');
  const [loading, setLoading] = useState(false);

  // Winner-related state
  const [winners, setWinners] = useState<GiveawayWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [showPickWinnerModal, setShowPickWinnerModal] = useState(false);

  useEffect(() => {
    if (giveaway) {
      setTitle(giveaway.title);
      setPrize(giveaway.prizeValue?.toString() || '');
      setEndAt(giveaway.endAt ? giveaway.endAt.split('T')[0] : '');
      setDesc(giveaway.description || '');
      setStatus(giveaway.status);

      // Load winners
      loadWinners();
    }
  }, [giveaway]);

  const loadWinners = async () => {
    if (!giveaway?.id) return;

    setLoadingWinners(true);
    try {
      const { data, error } = await supabase
        .from('giveaway_winners')
        .select(
          `
          id,
          entry_id,
          user_id,
          method,
          picked_at,
          notified,
          giveaway_entries!inner(entry_number, full_name)
        `,
        )
        .eq('giveaway_id', giveaway.id)
        .order('picked_at', { ascending: false });

      if (error) throw error;

      const formattedWinners = (data || []).map((w: any) => ({
        id: w.id,
        entry_id: w.entry_id,
        user_id: w.user_id,
        method: w.method,
        picked_at: w.picked_at,
        notified: w.notified,
        entry_number: w.giveaway_entries?.entry_number,
        full_name: w.giveaway_entries?.full_name,
      }));

      setWinners(formattedWinners);
    } catch (error) {
      console.error('Error loading winners:', error);
    } finally {
      setLoadingWinners(false);
    }
  };

  const handleWinnerPicked = async (giveawayId: string, entryId: string) => {
    try {
      // Get entry details
      const { data: entryData, error: entryError } = await supabase
        .from('giveaway_entries')
        .select('user_id')
        .eq('id', entryId)
        .single();

      if (entryError) throw entryError;

      // Count existing winners to determine rank
      const { count: existingWinnersCount } = await supabase
        .from('giveaway_winners')
        .select('*', { count: 'exact', head: true })
        .eq('giveaway_id', giveawayId);

      const nextRank = (existingWinnersCount || 0) + 1;

      // Calculate claim deadline (7 days from now)
      const claimDeadline = new Date();
      claimDeadline.setDate(claimDeadline.getDate() + 7);

      // Insert into giveaway_winners table
      const { error: winnerError } = await supabase
        .from('giveaway_winners')
        .insert({
          giveaway_id: giveawayId,
          entry_id: entryId,
          user_id: entryData?.user_id || null,
          rank: nextRank,
          method: 'random',
          picked_at: new Date().toISOString(),
          selected_at: new Date().toISOString(),
          claim_deadline: claimDeadline.toISOString(),
          notified: false,
          status: 'selected',
        });

      if (winnerError) throw winnerError;

      // Update giveaway with winner and status
      const { error: updateError } = await supabase
        .from('giveaways')
        .update({
          winner_entry_id: entryId,
          status: 'ended',
        })
        .eq('id', giveawayId);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Winner has been selected! 🎉');

      // Reload winners to show the new one
      await loadWinners();

      // Update local status
      setStatus('ended');

      // Close pick winner modal
      setShowPickWinnerModal(false);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleCancel = () => {
    console.log('=== ModalEditGiveaway: Cancel button pressed ===');
    onClose();
  };

  const submit = async () => {
    console.log('=== ModalEditGiveaway: Submit button pressed ===');
    console.log('Title:', title);
    console.log('Prize:', prize);
    console.log('Status:', status);

    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        id: giveaway!.id,
        title: title.trim(),
        prizeValue: Number(prize) || 0,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        status,
        description: desc.trim(),
      });
      console.log('=== ModalEditGiveaway: Save successful, closing modal ===');
      onClose();
    } catch (error) {
      console.error('=== ModalEditGiveaway: Save error ===', error);
      Alert.alert('Error', 'Failed to save giveaway. Please try again.');
    } finally {
      setLoading(false);
    }
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
          Edit Giveaway
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#0c0c0c' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Giveaway title"
          placeholderTextColor="#6b7280"
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
          Prize Value (USD)
        </Text>
        <TextInput
          value={prize}
          onChangeText={setPrize}
          keyboardType="numeric"
          placeholder="500"
          placeholderTextColor="#6b7280"
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
          End Date (YYYY-MM-DD)
        </Text>
        <TextInput
          value={endAt}
          onChangeText={setEndAt}
          placeholder="2025-09-15"
          placeholderTextColor="#6b7280"
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Status</Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        >
          {['active', 'ended', 'awarded', 'archived'].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s as IGiveawayEdit['status'])}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor:
                  status === s ? BaseColors.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  color: status === s ? 'white' : '#9ca3af',
                  fontWeight: status === s ? '700' : '400',
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Description</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="What will the winner receive?"
          placeholderTextColor="#6b7280"
          multiline
          style={{
            color: 'white',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            minHeight: 80,
            marginBottom: 10,
            backgroundColor: '#16171a',
          }}
        />

        {/* Winner Information Section */}
        <View style={{ marginTop: 20, marginBottom: 10 }}>
          <Text
            style={{
              color: 'white',
              fontWeight: '800',
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            Winner Information
          </Text>

          {loadingWinners ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={BaseColors.primary} />
            </View>
          ) : winners.length > 0 ? (
            <View>
              {winners.map((winner, index) => (
                <View
                  key={winner.id}
                  style={{
                    backgroundColor: '#16171a',
                    borderWidth: 1,
                    borderColor:
                      index === 0 ? '#34d399' : BaseColors.PanelBorderColor,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  {index === 0 && (
                    <Text
                      style={{
                        color: '#34d399',
                        fontWeight: '700',
                        marginBottom: 6,
                      }}
                    >
                      🎉 Current Winner
                    </Text>
                  )}
                  <Text
                    style={{ color: 'white', fontWeight: '700', fontSize: 16 }}
                  >
                    Entry #{winner.entry_number || 'N/A'}
                  </Text>
                  {winner.full_name && (
                    <Text style={{ color: '#9ca3af', marginTop: 4 }}>
                      Name: {winner.full_name}
                    </Text>
                  )}
                  <Text style={{ color: '#9ca3af', marginTop: 4 }}>
                    Picked: {new Date(winner.picked_at).toLocaleString()}
                  </Text>
                  <Text style={{ color: '#9ca3af', marginTop: 4 }}>
                    Notified: {winner.notified ? 'Yes' : 'No'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: '#16171a',
                borderWidth: 1,
                borderColor: BaseColors.PanelBorderColor,
                borderRadius: 8,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#9ca3af' }}>No winner selected yet</Text>
            </View>
          )}

          {/* Pick Winner Button */}
          <View style={{ marginTop: 12 }}>
            <LFButton
              type="primary"
              label={winners.length > 0 ? 'Pick Another Winner' : 'Pick Winner'}
              icon="shuffle"
              onPress={() => setShowPickWinnerModal(true)}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: BaseColors.PanelBorderColor,
          flexDirection: 'row',
          gap: 12,
          backgroundColor: '#0c0c0c',
        }}
      >
        <View style={{ flex: 1 }}>
          <LFButton type="danger" label="Cancel" onPress={handleCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <LFButton
            type="primary"
            label={loading ? 'Saving...' : 'Save Changes'}
            onPress={submit}
            disabled={loading}
          />
        </View>
      </View>

      {/* Pick Winner Modal (nested) */}
      {giveaway && (
        <ModalPickWinner
          visible={showPickWinnerModal}
          giveaway={{
            id: giveaway.id,
            title: giveaway.title,
            entries_count: giveaway.entries_count || 0,
          }}
          onClose={() => setShowPickWinnerModal(false)}
          onWinnerPicked={handleWinnerPicked}
        />
      )}
    </Modal>
  );
};

export default ModalEditGiveaway;
