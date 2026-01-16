import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../ApiSupabase/supabase';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import LFButton from '../../components/LoginForms/Button/LFButton';

type GiveawayEntry = {
  id: string;
  user_id?: string;
  entry_number?: number;
  full_name?: string;
  created_at?: string;
};

type GiveawayWinner = {
  id: string;
  entry_id: string;
  user_id?: string;
  picked_at: string;
  notified: boolean;
  entry_number?: number;
  full_name?: string;
};

type Giveaway = {
  id: string;
  title: string;
  entries_count: number;
};

export default function ModalPickWinner({
  visible,
  giveaway,
  onClose,
  onWinnerPicked,
}: {
  visible: boolean;
  giveaway: Giveaway | null;
  onClose: () => void;
  onWinnerPicked: (giveawayId: string, entryId: string) => Promise<void>;
}) {
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<GiveawayEntry | null>(null);
  const [pickedEntryNumber, setPickedEntryNumber] = useState<number | null>(
    null,
  );
  const [existingWinners, setExistingWinners] = useState<GiveawayWinner[]>([]);

  useEffect(() => {
    if (!giveaway || !visible) return;

    (async () => {
      setLoading(true);
      setPicked(null);
      setPickedEntryNumber(null);

      try {
        // Load entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('giveaway_entries')
          .select('id, user_id, entry_number, full_name, created_at')
          .eq('giveaway_id', giveaway.id)
          .order('entry_number', { ascending: true });

        if (entriesError) throw entriesError;
        setEntries((entriesData as GiveawayEntry[]) || []);

        // Load existing winners
        const { data: winnersData, error: winnersError } = await supabase
          .from('giveaway_winners')
          .select(
            `
            id,
            entry_id,
            user_id,
            picked_at,
            notified,
            giveaway_entries!inner(entry_number, full_name)
          `,
          )
          .eq('giveaway_id', giveaway.id)
          .order('picked_at', { ascending: false });

        if (!winnersError && winnersData) {
          const formattedWinners = winnersData.map((w: any) => ({
            id: w.id,
            entry_id: w.entry_id,
            user_id: w.user_id,
            picked_at: w.picked_at,
            notified: w.notified,
            entry_number: w.giveaway_entries?.entry_number,
            full_name: w.giveaway_entries?.full_name,
          }));
          setExistingWinners(formattedWinners);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setEntries([]);
        setExistingWinners([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [giveaway?.id, visible]);

  const pickRandomWinner = async () => {
    if (!entries.length || !giveaway) return;

    // Generate random entry number between 1 and total entries
    const randomEntryNumber = Math.floor(Math.random() * entries.length) + 1;

    // Find entry with this number (or fallback to index-based selection)
    const winner =
      entries.find((e) => e.entry_number === randomEntryNumber) ||
      entries[randomEntryNumber - 1];

    if (winner) {
      setPickedEntryNumber(randomEntryNumber);
      setPicked(winner);
      await onWinnerPicked(giveaway.id, winner.id);
    }
  };

  const handleRedraw = () => {
    Alert.alert(
      'Redraw Winner',
      'This will select a new winner. The previous winner will remain in the history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redraw',
          style: 'default',
          onPress: () => {
            setPicked(null);
            setPickedEntryNumber(null);
          },
        },
      ],
    );
  };

  if (!giveaway) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
          }}
        />

        <View
          style={{
            backgroundColor: '#16171a',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: BaseColors.secondary,
            maxHeight: '80%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <View
            style={{
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: BaseColors.secondary,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
              Pick Winner — {giveaway.title}
            </Text>
            <Text style={{ color: '#9ca3af', marginTop: 8, fontSize: 14 }}>
              Total Entries: {entries.length}
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={{ maxHeight: 400 }}
            contentContainerStyle={{ padding: 20 }}
          >
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={BaseColors.primary} />
                <Text style={{ color: '#9ca3af', marginTop: 12 }}>
                  Loading entries...
                </Text>
              </View>
            ) : entries.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#9ca3af', fontSize: 16 }}>
                  No entries found for this giveaway
                </Text>
              </View>
            ) : (
              <>
                {/* Show existing winners if any */}
                {existingWinners.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: '#9ca3af',
                        fontWeight: '700',
                        marginBottom: 8,
                      }}
                    >
                      Previous Winners:
                    </Text>
                    {existingWinners.map((w, idx) => (
                      <View
                        key={w.id}
                        style={{
                          backgroundColor: '#1a1b1e',
                          borderWidth: 1,
                          borderColor: '#2a2b2e',
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: '#60a5fa',
                            fontWeight: '700',
                            fontSize: 14,
                          }}
                        >
                          Winner #{idx + 1} - Entry #{w.entry_number}
                        </Text>
                        {w.full_name && (
                          <Text
                            style={{
                              color: '#9ca3af',
                              fontSize: 13,
                              marginTop: 4,
                            }}
                          >
                            {w.full_name}
                          </Text>
                        )}
                        <Text
                          style={{
                            color: '#6b7280',
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          Picked: {new Date(w.picked_at).toLocaleString()}
                        </Text>
                        <Text style={{ color: '#6b7280', fontSize: 12 }}>
                          Notified: {w.notified ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Current pick or instructions */}
                {picked ? (
                  <View
                    style={{
                      backgroundColor: '#0f172a',
                      borderWidth: 1,
                      borderColor: '#34d399',
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: '#34d399',
                        fontWeight: '800',
                        fontSize: 20,
                        marginBottom: 12,
                      }}
                    >
                      🎉 New Winner Selected!
                    </Text>
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: '700',
                        fontSize: 18,
                        marginBottom: 8,
                      }}
                    >
                      Entry #{pickedEntryNumber}
                    </Text>
                    {picked.full_name && (
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 16,
                          marginBottom: 4,
                        }}
                      >
                        Name: {picked.full_name}
                      </Text>
                    )}
                    <Text
                      style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}
                    >
                      The winner has been recorded. You can redraw if the winner
                      doesn't respond.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: '#0f172a',
                      borderWidth: 1,
                      borderColor: BaseColors.secondary,
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                      {existingWinners.length > 0
                        ? 'Click "Pick Another Winner" to select a new winner if the previous winner(s) did not respond.'
                        : 'Click "Pick Random Winner" to randomly select a winner from all entries.'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: BaseColors.secondary,
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <LFButton type="danger" label="Close" onPress={onClose} />
            </View>
            {picked && existingWinners.length > 0 && (
              <View style={{ flex: 1 }}>
                <LFButton
                  type="secondary"
                  label="Redraw"
                  onPress={handleRedraw}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <LFButton
                type="primary"
                label={
                  loading
                    ? 'Loading...'
                    : existingWinners.length > 0
                    ? 'Pick Another Winner'
                    : 'Pick Random Winner'
                }
                onPress={pickRandomWinner}
                disabled={loading || !!picked || entries.length === 0}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
