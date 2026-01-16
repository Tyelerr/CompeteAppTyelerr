import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import UIPanel from '../../components/UI/UIPanel';
import LFButton from '../../components/LoginForms/Button/LFButton';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { Ionicons } from '@expo/vector-icons';
import type { KeyboardTypeOptions } from 'react-native';

/* ----------------------------------------------------------------------------
  Types
---------------------------------------------------------------------------- */
type GiveawayStatus = 'active' | 'ended' | 'scheduled';

interface RawGiveaway {
  id: string;
  title: string;
  prize_value?: number;
  status: string;
  end_at?: string;
  entries_count: number;
  image_url?: string;
  description?: string;
  winner_entry_id?: string | null;
}

interface RawEntry {
  id: string;
  user_id?: string;
  name?: string;
  email?: string;
}

export interface IGiveaway {
  id: string;
  title: string;
  prizeValue?: number;
  status: GiveawayStatus;
  endAt?: string; // ISO
  entriesCount: number;
  imageUrl?: string;
  description?: string;
  winnerEntryId?: string | null;
}

export interface IEntry {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
}

/* ----------------------------------------------------------------------------
  API - Real Supabase implementation
---------------------------------------------------------------------------- */
import { supabase } from '../../ApiSupabase/supabase';

const api = {
  async list() {
    const { data, error } = await supabase
      .from('giveaways')
      .select(
        'id, numeric_id, title, prize_value, status, end_at, description, winner_entry_id',
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rawData = data as RawGiveaway[] | null;
    return (
      rawData?.map((item) => ({
        id: item.id,
        numericId: item.numeric_id,
        title: item.title,
        prizeValue: item.prize_value,
        status: item.status as GiveawayStatus,
        endAt: item.end_at,
        entriesCount: 0, // Will be calculated separately
        imageUrl: item.image_url,
        description: item.description,
        winnerEntryId: item.winner_entry_id,
      })) || []
    );
  },
  async create(payload: Partial<IGiveaway>) {
    const payloadForSupabase = {
      title: payload.title,
      prize_value: payload.prizeValue,
      status: payload.status,
      end_at: payload.endAt,
      description: payload.description,
    };
    const { data, error } = await supabase
      .from('giveaways')
      .insert([payloadForSupabase]);
    if (error) throw error;
    const rawItem = data?.[0] as RawGiveaway | undefined;
    return rawItem
      ? {
          id: rawItem.id,
          title: rawItem.title,
          prizeValue: rawItem.prize_value,
          status: rawItem.status as GiveawayStatus,
          endAt: rawItem.end_at,
          entriesCount: rawItem.entries_count || 0,
          imageUrl: rawItem.image_url,
          description: rawItem.description,
          winnerEntryId: rawItem.winner_entry_id,
        }
      : null;
  },
  async end(id: string) {
    const { error } = await supabase
      .from('giveaways')
      .update({ status: 'ended' })
      .eq('id', id);
    if (error) throw error;
  },
  async entries(giveawayId: string) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('giveaway_id', giveawayId);
    if (error) throw error;
    const rawData = data as RawEntry[] | null;
    return (
      rawData?.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        email: item.email,
      })) || []
    );
  },
  async setWinner(giveawayId: string, entryId: string) {
    const { error } = await supabase
      .from('giveaways')
      .update({ winner_entry_id: entryId, status: 'ended' })
      .eq('id', giveawayId);
    if (error) throw error;
  },
  async delete(giveawayId: string) {
    const { error } = await supabase
      .from('giveaways')
      .delete()
      .eq('id', giveawayId);
    if (error) throw error;
  },
};

/* ----------------------------------------------------------------------------
  Small UI helpers
---------------------------------------------------------------------------- */
const fmtMoney = (n?: number) =>
  typeof n === 'number'
    ? n.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })
    : '';

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '—';

const StatusPill = ({ s }: { s: GiveawayStatus }) => {
  const map =
    s === 'active'
      ? { bg: '#022c22', text: '#34d399', label: 'Active' }
      : s === 'scheduled'
      ? { bg: '#1f2a44', text: '#93c5fd', label: 'Scheduled' }
      : { bg: '#2a1f1f', text: '#fca5a5', label: 'Ended' };
  return (
    <View
      style={{
        backgroundColor: map.bg,
        borderColor: map.text + '66',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: map.text, fontWeight: '700', fontSize: 12 }}>
        {map.label}
      </Text>
    </View>
  );
};

/* ----------------------------------------------------------------------------
  Create Giveaway Modal — keyboard-stable
---------------------------------------------------------------------------- */
function ModalCreateGiveaway({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: Partial<IGiveaway>) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [prize, setPrize] = useState('');
  const [endAt, setEndAt] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await onCreate({
      title: title.trim() || 'Untitled Giveaway',
      prizeValue: Number(prize) || 0,
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      status: 'active',
      description: desc.trim(),
    });
    setLoading(false);
    setTitle('');
    setPrize('');
    setEndAt('');
    setDesc('');
    onClose();
  };

  const Input = ({
    value,
    onChangeText,
    placeholder,
    keyboardType,
    multiline,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: KeyboardTypeOptions;
    multiline?: boolean;
  }) => {
    const resolvedKeyboardType: KeyboardTypeOptions =
      Platform.OS === 'ios' && keyboardType === 'numeric'
        ? 'number-pad'
        : keyboardType ?? 'default';

    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        keyboardType={resolvedKeyboardType}
        multiline={!!multiline}
        style={{
          color: 'white',
          borderWidth: 1,
          borderColor: BaseColors.PanelBorderColor,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 12 : 10,
          minHeight: multiline ? 80 : undefined,
          marginBottom: 10,
          backgroundColor: '#16171a',
        }}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <TouchableOpacity
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: -1,
            }}
            onPress={onClose}
            activeOpacity={1}
          />

          <View
            style={{
              backgroundColor: '#0c0c0c',
              borderTopLeftRadius: BasePaddingsMargins.m15,
              borderTopRightRadius: BasePaddingsMargins.m15,
              maxHeight: '90%',
              position: 'relative',
            }}
          >
            {/* Fixed Header */}
            <View
              style={{
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'stretch',
                paddingHorizontal: 16,
                paddingTop: 25,
                paddingBottom: 15,
                borderTopLeftRadius: BasePaddingsMargins.m15,
                borderTopRightRadius: BasePaddingsMargins.m15,
                backgroundColor: '#0c0c0c',
                zIndex: 1000,
                minHeight: 60,
                position: 'relative',
                overflow: 'hidden',
                elevation: 5,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
                + Create New Giveaway
              </Text>
            </View>

            {/* Fixed Close Button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 16,
                top: 20,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#222',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
              }}
              onPress={onClose}
            >
              <Text style={{ color: '#fff', fontSize: 20 }}>×</Text>
            </TouchableOpacity>

            {/* Scrollable Content */}
            <ScrollView
              style={{
                flex: 1,
                backgroundColor: '#0c0c0c',
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingTop: 20,
                paddingBottom: 30,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: '#9ca3af', marginBottom: 6 }}>Title</Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Giveaway title"
              />

              <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                Prize Value (USD)
              </Text>
              <Input
                value={prize}
                onChangeText={setPrize}
                keyboardType="numeric"
                placeholder="500"
              />

              <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                End Date (YYYY-MM-DD)
              </Text>
              <Input
                value={endAt}
                onChangeText={setEndAt}
                placeholder="2025-09-15"
              />

              <Text style={{ color: '#9ca3af', marginBottom: 6 }}>
                Description
              </Text>
              <Input
                value={desc}
                onChangeText={setDesc}
                placeholder="What will the winner receive?"
                multiline
              />
            </ScrollView>

            {/* Fixed Footer */}
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: BaseColors.PanelBorderColor,
                backgroundColor: '#0c0c0c',
                flexDirection: 'row',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <LFButton type="danger" label="Cancel" onPress={onClose} />
              </View>
              <View style={{ flex: 1 }}>
                <LFButton
                  type="primary"
                  label={loading ? 'Saving...' : 'Save Giveaway'}
                  onPress={submit}
                  disabled={loading}
                />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ----------------------------------------------------------------------------
  Pick Winner Modal (unchanged – no typing here)
---------------------------------------------------------------------------- */
function ModalPickWinner({
  visible,
  onClose,
  giveaway,
  onPicked,
}: {
  visible: boolean;
  onClose: () => void;
  giveaway: IGiveaway | null;
  onPicked: (entry: IEntry) => Promise<void>;
}) {
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<IEntry | null>(null);

  useEffect(() => {
    (async () => {
      if (!giveaway) return;
      setLoading(true);
      const data = await api.entries(giveaway.id);
      setEntries(data);
      setLoading(false);
    })();
  }, [giveaway?.id, visible]);

  const pick = async () => {
    if (!entries.length) return;
    const idx = Math.floor(Math.random() * entries.length);
    const e = entries[idx];
    setPicked(e);
    await onPicked(e);
  };

  if (!giveaway) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          padding: 22,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            backgroundColor: '#16171a',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            padding: 16,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
            Pick Winner — {giveaway.title}
          </Text>

          <Text style={{ color: '#9ca3af', marginTop: 8 }}>
            Entries: {entries.length}
          </Text>

          <View style={{ height: 14 }} />

          {picked ? (
            <View
              style={{
                backgroundColor: '#0f172a',
                borderWidth: 1,
                borderColor: '#1f2937',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: '#34d399', fontWeight: '800' }}>
                🎉 Winner Selected!
              </Text>
              <Text style={{ color: 'white', marginTop: 6 }}>
                {picked.name || 'Entry'}{' '}
                <Text style={{ color: '#9ca3af' }}>{picked.email || ''}</Text>
              </Text>
            </View>
          ) : null}

          <View style={{ height: 14 }} />
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <LFButton type="danger" label="Close" onPress={onClose} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <LFButton
                type="primary"
                label={loading ? 'Loading...' : 'Pick Random Winner'}
                onPress={pick}
                disabled={loading || !!picked || !entries.length}
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ----------------------------------------------------------------------------
  Main Manage Screen
---------------------------------------------------------------------------- */
export default function ShopManage({
  onCreateGift,
}: {
  onCreateGift?: () => void;
}) {
  const [items, setItems] = useState<IGiveaway[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [current, setCurrent] = useState<IGiveaway | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.list();
        console.log('Fetched giveaways data:', data);
        setItems(data);
      } catch (error) {
        console.error('Error fetching giveaways:', error);
      }
      setLoading(false);
    })();
  }, []);

  const analytics = useMemo(() => {
    const active = items.filter((g) => g.status === 'active');
    const totalPrize = items.reduce((sum, g) => sum + (g.prizeValue || 0), 0);
    const totalEntries = items.reduce(
      (sum, g) => sum + (g.entriesCount || 0),
      0,
    );
    // Updated analytics: add any new metrics here if needed
    return {
      activeCount: active.length,
      totalEntries: totalEntries,
      totalPrize: totalPrize,
    };
  }, [items]);

  const openPicker = (g: IGiveaway) => {
    setCurrent(g);
    setPickOpen(true);
  };

  const endGiveaway = async (g: IGiveaway) => {
    await api.end(g.id);
    setItems((prev) =>
      prev.map((x) => (x.id === g.id ? { ...x, status: 'ended' } : x)),
    );
  };

  const removeGiveaway = async (g: IGiveaway) => {
    await api.delete(g.id);
    setItems((prev) => prev.filter((x) => x.id !== g.id));
  };

  return (
    <>
      {/* Analytics */}
      <UIPanel>
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
          Giveaway Analytics
        </Text>

        <View style={{ height: 10 }} />

        <View
          style={{ flexDirection: 'row', gap: 10 as any, flexWrap: 'wrap' }}
        >
          <StatCard
            label="Active Giveaways"
            value={String(analytics.activeCount)}
          />
          <StatCard
            label="Total Entries"
            value={String(analytics.totalEntries)}
          />
          <StatCard
            label="Total Prize Value"
            value={fmtMoney(analytics.totalPrize)}
          />
        </View>
      </UIPanel>

      {/* Quick Actions */}
      <UIPanel>
        <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
          Quick Actions
        </Text>

        <View style={{ height: 12 }} />

        <View style={{ gap: 10 }}>
          <LFButton
            type="primary"
            label="Create New Giveaway"
            icon="gift"
            onPress={() => setCreateOpen(true)}
          />
          <LFButton
            type="secondary"
            label="View All Participants"
            icon="people"
            onPress={() => {}}
          />
          <LFButton
            type="secondary"
            label="Past Winners"
            icon="trophy"
            onPress={() => {}}
          />
        </View>
      </UIPanel>

      {/* List */}
      <UIPanel>
        <Text
          style={{
            color: 'white',
            fontWeight: '800',
            fontSize: 18,
            marginBottom: 6,
          }}
        >
          Random Winner Generator
        </Text>

        {loading ? (
          <Text style={{ color: '#9ca3af', marginTop: 8 }}>Loading…</Text>
        ) : items.length === 0 ? (
          <Text style={{ color: '#9ca3af', marginTop: 8 }}>
            No giveaways found.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {items.map((g) => (
              <GiveawayCard
                key={g.id}
                g={g}
                onPick={() => openPicker(g)}
                onEnd={() => endGiveaway(g)}
                onDelete={() => removeGiveaway(g)}
              />
            ))}
          </View>
        )}
      </UIPanel>

      {/* Modals — keep mounted, only toggle visibility */}
      <ModalCreateGiveaway
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload) => {
          const created = await api.create(payload);
          if (created) {
            setItems((prev) => [created, ...prev]);
          }
        }}
      />
      <ModalPickWinner
        visible={pickOpen}
        onClose={() => setPickOpen(false)}
        giveaway={current}
        onPicked={async (entry) => {
          if (!current) return;
          await api.setWinner(current.id, entry.id);
          setItems((prev) =>
            prev.map((x) =>
              x.id === current.id
                ? { ...x, status: 'ended', winnerEntryId: entry.id }
                : x,
            ),
          );
        }}
      />
    </>
  );
}

/* ----------------------------------------------------------------------------
  Subcomponents
---------------------------------------------------------------------------- */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexGrow: 1,
        minWidth: 110,
        backgroundColor: '#0f1115',
        borderWidth: 1,
        borderColor: BaseColors.PanelBorderColor,
        borderRadius: 10,
        padding: 14,
      }}
    >
      <Text style={{ color: '#93c5fd', fontWeight: '800', fontSize: 18 }}>
        {value}
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 6 }}>{label}</Text>
    </View>
  );
}

function GiveawayCard({
  g,
  onPick,
  onEnd,
  onDelete,
}: {
  g: IGiveaway;
  onPick: () => void;
  onEnd: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: '#141416',
        borderWidth: 1,
        borderColor: BaseColors.PanelBorderColor,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <StatusPill s={g.status} />
        <Text style={{ color: '#60a5fa', fontWeight: '800' }}>
          {fmtMoney(g.prizeValue)}
        </Text>
      </View>

      <Text
        style={{
          color: 'white',
          fontWeight: '800',
          fontSize: 16,
          marginTop: 8,
        }}
      >
        {g.title}
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <Text style={{ color: '#9ca3af' }}>Entries </Text>
        <Text style={{ color: 'white', fontWeight: '700' }}>
          {g.entriesCount}
        </Text>
        <Text style={{ color: '#9ca3af' }}> · Ends {fmtDate(g.endAt)}</Text>
      </View>

      <View style={{ height: 10 }} />

      <View style={{ flexDirection: 'row', gap: 10 as any }}>
        <View style={{ flex: 1 }}>
          <LFButton
            type="primary"
            label={g.status === 'ended' ? 'View Winner' : 'Pick Winner'}
            icon="shuffle"
            onPress={onPick}
          />
        </View>
        {g.status !== 'ended' ? (
          <View style={{ width: 120 }}>
            <LFButton type="secondary" label="End" onPress={onEnd} />
          </View>
        ) : null}
        <TouchableOpacity
          onPress={onDelete}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: '#221416',
            borderWidth: 1,
            borderColor: '#7a1f1f',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="trash" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
