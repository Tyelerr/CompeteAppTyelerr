// /screens/Shop/ScreenShop.tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../ApiSupabase/supabase';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Big tabs UI (same as Home)
import ShopSubNavigation, { ShopTab } from './ShopSubNavigation';

const AnimatedProgressBar = ({ progress }: { progress: number }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    animatedWidth.setValue(0); // Reset animation value before starting new animation
    Animated.timing(animatedWidth, {
      toValue: Math.min(Math.max(progress, 0), 1) * width,
      duration: 1200,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progress, width, animatedWidth]);

  return (
    <View
      style={{
        height: 16,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 144, 255, 0.2)', // Lower opacity background
      }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          height: 16,
          width: animatedWidth,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={['#1E90FF', '#5AC8FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// ✅ NEW: create-giveaway modal
import ModalCreateGiveaway from './ModalCreateGiveaway';
import ModalEditGiveaway from './ModalEditGiveaway';
import ModalViewGiveaway from './ModalViewGiveaway';
import ModalEnterGiveaway from './ModalEnterGiveaway';

// ✅ NEW: venue modals
import ModalSearchVenue from './ModalSearchVenue';
import ModalCreateVenue from './ModalCreateVenue';

type TShopTab = 'shop' | 'giveaways' | 'manage';
type RouteParams = { initialTab?: TShopTab };

type GiveawayPublic = {
  id: string;
  title: string;
  image_url: string | null;
  prize_value: number | string | null;
  entries_count: number;
  description?: string | null;
  end_at: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
  created_at?: string | null;
  maximum_entries?: number;
};

type VRow = GiveawayPublic & {
  selection_method?: 'random' | 'judged' | 'point_based';
  number_of_winners?: number | null;
  draw_mode?: 'auto_on_end' | 'manual';
  description?: string;
};

type Metrics = {
  active_count: number;
  total_entries: number;
  total_prize_value: number;
};

// ---- Gate: master admin or is_giveaway_admin(uid) ----
async function canManageGiveaways(): Promise<{
  canManage: boolean;
  isMaster: boolean;
}> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { canManage: false, isMaster: false };

  let isMaster = false;
  if ((auth?.user?.user_metadata as any)?.role === 'master-administrator') {
    isMaster = true;
  } else {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();
      if (data?.role === 'master-administrator') isMaster = true;
    } catch {}
  }

  let canManage = isMaster;
  if (!canManage) {
    try {
      const { data, error } = await supabase.rpc('is_giveaway_admin', { uid });
      if (!error && typeof data === 'boolean') canManage = data;
    } catch {}
  }

  return { canManage, isMaster };
}

/* ---------- small UI helpers ---------- */
const StatChip = ({ label, value }: { label: string; value: string }) => (
  <View
    style={{
      flex: 1,
      minWidth: 110,
      backgroundColor: BaseColors.dark,
      borderWidth: 1,
      borderColor: BaseColors.secondary,
      borderRadius: 12,
      padding: 14,
      marginRight: 10,
      marginBottom: 10,
    }}
  >
    <Text
      style={{
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
      }}
    >
      {value}
    </Text>
    <Text style={{ color: BaseColors.othertexts }}>{label}</Text>
  </View>
);

const SectionTitle = ({ label }: { label: string }) => (
  <Text
    style={{ color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 10 }}
  >
    {label}
  </Text>
);

const GiveawayPublicCard = ({
  row,
  onEnter,
  onView,
}: {
  row: GiveawayPublic;
  onEnter: (id: string) => void;
  onView: (row: GiveawayPublic) => void;
}) => {
  const prize = Number(row.prize_value || 0);
  const maxEntries = row.maximum_entries ?? 500;
  const progress = Math.min(row.entries_count / maxEntries, 1);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BaseColors.secondary,
        borderRadius: 12,
        padding: 24,
        marginBottom: BasePaddingsMargins.m20,
        backgroundColor: BaseColors.dark,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        {!!row.image_url && (
          <Image
            source={{ uri: row.image_url }}
            style={{
              width: 90,
              height: 90,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
            }}
          />
        )}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontWeight: '800',
                fontSize: (TextsSizes.h4 ?? 20) + 2,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {row.title}
            </Text>
            <Text
              style={{
                color: '#0080FF',
                fontWeight: '900',
                fontSize: 18,
                textShadowColor: '#0080FF',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 5,
              }}
            >
              ${prize} Value
            </Text>
          </View>
          {!!row.description && (
            <Text
              style={{
                color: BaseColors.othertexts,
                fontSize: 14,
                marginBottom: 6,
              }}
              numberOfLines={2}
            >
              {row.description}
            </Text>
          )}
          <Text
            style={{
              color: BaseColors.othertexts,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            {row.entries_count}/{maxEntries} Total Entries
          </Text>
          <AnimatedProgressBar progress={progress} />
          {!!row.end_at && (
            <Text
              style={{
                color: BaseColors.othertexts,
                marginTop: 8,
                fontWeight: '600',
              }}
            >
              Ends: {new Date(row.end_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      <View
        style={{
          marginTop: BasePaddingsMargins.m20,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => onEnter(row.id)}
          style={{
            flex: 1,
            backgroundColor: BaseColors.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            Enter Giveaway
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onView(row)}
          style={{
            flex: 1,
            backgroundColor: BaseColors.secondary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            View
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ManageCard = ({
  r,
  onPick,
  onEdit,
  onDelete,
  isMaster,
}: {
  r: VRow;
  onPick: (r: VRow) => void;
  onEdit: (r: VRow) => void;
  onDelete: (id: string) => void;
  isMaster: boolean;
}) => {
  const canPick = r.status === 'ended' || r.draw_mode === 'manual';
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BaseColors.secondary,
        borderRadius: 12,
        padding: BasePaddingsMargins.m15,
        marginBottom: BasePaddingsMargins.m15,
        backgroundColor: BaseColors.dark,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View
          style={{
            backgroundColor: BaseColors.contentSwitcherBackgroundCOlor,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: BaseColors.primary, fontWeight: '700' }}>
            {r.status.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: '#fff', fontWeight: '800' }}>
          ${Number(r.prize_value || 0)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {!!r.image_url && (
          <Image
            source={{ uri: r.image_url }}
            style={{
              width: 70,
              height: 70,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
            }}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#fff',
              fontWeight: '800',
              fontSize: TextsSizes.h5 ?? 18,
            }}
            numberOfLines={2}
          >
            {r.title}
          </Text>
          <Text style={{ color: BaseColors.othertexts }}>
            {r.entries_count} entries
          </Text>
          {!!r.end_at && (
            <Text style={{ color: BaseColors.othertexts }}>
              Ends: {new Date(r.end_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View
        style={{
          marginTop: BasePaddingsMargins.m15,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => canPick && onPick(r)}
          disabled={!canPick}
          style={{
            flex: 1,
            backgroundColor: canPick
              ? BaseColors.primary
              : BaseColors.secondary,
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            opacity: canPick ? 1 : 0.6,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Pick Winner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onEdit(r)}
          style={{
            padding: 6,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#ffffff',
            borderRadius: 6,
            width: 32,
            height: 32,
          }}
        >
          <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        {isMaster && (
          <TouchableOpacity
            onPress={() => onDelete(r.id)}
            style={{
              padding: 6,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#ff4444',
              borderRadius: 6,
              width: 32,
              height: 32,
            }}
          >
            <Icon name="delete" size={20} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/* ---------- Screen ---------- */
export default function ScreenShop() {
  const route = useRoute<any>();
  const [tab, setTab] = useState<TShopTab>('giveaways');
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [isMaster, setIsMaster] = useState<boolean>(false);

  // ✅ NEW: modal state
  const [showCreate, setShowCreate] = useState(false);

  // public
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<GiveawayPublic[]>([]);

  // manage
  const [mLoading, setMLoading] = useState(false);
  const [mRows, setMRows] = useState<VRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  // edit modal state
  const [editGiveaway, setEditGiveaway] = useState<VRow | null>(null);

  // view modal state
  const [viewGiveaway, setViewGiveaway] = useState<GiveawayPublic | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  // enter modal state
  const [enterGiveawayModalVisible, setEnterGiveawayModalVisible] =
    useState(false);
  const [enterGiveawaySelected, setEnterGiveawaySelected] =
    useState<GiveawayPublic | null>(null);

  // venue modal state
  const [showSearchVenue, setShowSearchVenue] = useState(false);
  const [showCreateVenue, setShowCreateVenue] = useState(false);

  // gate
  useEffect(() => {
    (async () => {
      const result = await canManageGiveaways();
      setCanManage(result.canManage);
      setIsMaster(result.isMaster);
    })();
  }, []);

  // Function to handle venue selection from search modal
  const handleSelectVenue = (venue: any) => {
    // Add logic to add venue to user here
    setShowSearchVenue(false);
  };

  // Function to handle create new venue button in search modal
  const handleCreateNewVenue = () => {
    setShowSearchVenue(false);
    setTimeout(() => {
      setShowCreateVenue(true);
    }, 500); // Delay to allow modal close animation
  };

  // allow external navigation to set initial tab
  useEffect(() => {
    const p = (route?.params ?? {}) as RouteParams;
    if (
      p.initialTab &&
      ['shop', 'giveaways', 'manage'].includes(p.initialTab)
    ) {
      setTab(p.initialTab as TShopTab);
    }
  }, [route?.params]);

  // load public giveaways
  const loadGiveaways = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_giveaways_with_counts')
        .select(
          'id,title,image_url,prize_value,entries_count,description,end_at,status,created_at,maximum_entries',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      console.log('loadGiveaways data:', data);
      console.log('loadGiveaways error:', error);

      if (error) {
        alert('Error loading giveaways: ' + error.message);
        throw error;
      }

      setItems((data as GiveawayPublic[]) ?? []);
      console.log('Setting items with data:', data);
    } catch (e) {
      console.log(e);
      alert('Exception in loadGiveaways: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // load manage data (rows + metrics)
  const loadManage = useCallback(async () => {
    setMLoading(true);
    try {
      const m = await supabase.rpc('fn_giveaway_metrics');
      if (!m.error) setMetrics(m.data as Metrics);

      const { data, error } = await supabase
        .from('v_giveaways_with_counts')
        .select('*')
        .in('status', ['active', 'ended'])
        .order('end_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setMRows((data as VRow[]) ?? []);
    } catch (e) {
      console.log(e);
    } finally {
      setMLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'giveaways') {
      console.log('Tab is giveaways, calling loadGiveaways');
      loadGiveaways();
    }
    if (tab === 'manage' && canManage) loadManage();
  }, [tab, canManage, loadGiveaways, loadManage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGiveaways();
    setRefreshing(false);
  }, [loadGiveaways]);

  // RPC: enter
  const enterGiveaway = async (
    id: string,
    agreements?: {
      agree18: boolean;
      agreeRules: boolean;
      agreePrivacy: boolean;
      agreeOneEntry: boolean;
      marketingOptIn: boolean;
    },
  ) => {
    const { error } = await supabase.rpc('fn_enter_giveaway', {
      p_giveaway_id: id,
      p_agree_18: agreements?.agree18 || false,
      p_agree_rules: agreements?.agreeRules || false,
      p_agree_privacy: agreements?.agreePrivacy || false,
      p_agree_one_entry: agreements?.agreeOneEntry || false,
      p_marketing_opt_in: agreements?.marketingOptIn || false,
    });
    if (error) {
      Alert.alert('Could not enter', error.message);
    } else {
      Alert.alert("You're in!", 'Good luck 🎉');
      loadGiveaways();
    }
  };

  // Show enter giveaway modal
  const showEnterGiveawayModal = (giveaway: GiveawayPublic) => {
    setEnterGiveawaySelected(giveaway);
    setEnterGiveawayModalVisible(true);
  };

  // Hide enter giveaway modal
  const hideEnterGiveawayModal = () => {
    setEnterGiveawayModalVisible(false);
    setEnterGiveawaySelected(null);
  };

  // Handle agree in enter giveaway modal
  const handleEnterGiveawayAgree = async (
    id: string,
    agreements: {
      agree18: boolean;
      agreeRules: boolean;
      agreePrivacy: boolean;
      agreeOneEntry: boolean;
      marketingOptIn: boolean;
    },
  ) => {
    hideEnterGiveawayModal();
    await enterGiveaway(id, agreements);
  };

  // RPC: pick winners
  const pickWinners = async (r: VRow) => {
    const n = Math.max(1, Number(r.number_of_winners || 1));
    Alert.alert('Pick Winners', `Draw ${n} winner${n > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          const { data, error } = await supabase.rpc('fn_pick_random_winners', {
            p_giveaway_id: r.id,
            p_n: n,
          });
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          const winners = (data as any[]) || [];
          Alert.alert(
            'Winners picked',
            winners.length
              ? winners
                  .map(
                    (w: any, i: number) => `#${i + 1} • user_id: ${w.user_id}`,
                  )
                  .join('\n')
              : 'No eligible entries.',
          );
          loadManage();
        },
      },
    ]);
  };

  // RPC: delete giveaway (master only)
  const deleteGiveaway = async (id: string) => {
    Alert.alert(
      'Delete Giveaway',
      'Are you sure you want to delete this giveaway? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('giveaways')
              .delete()
              .eq('id', id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Deleted', 'Giveaway has been deleted.');
              loadManage();
            }
          },
        },
      ],
    );
  };

  // Show view modal
  const showViewModal = (giveaway: GiveawayPublic) => {
    setViewGiveaway(giveaway);
    setViewModalVisible(true);
  };

  // Hide view modal
  const hideViewModal = () => {
    setViewModalVisible(false);
    setViewGiveaway(null);
  };

  /* ---------- BIG TABS like Home (ShopSubNavigation) ---------- */
  const toShopTab = (t: TShopTab): ShopTab =>
    t === 'shop' ? 'home' : t === 'giveaways' ? 'rewards' : 'manage';

  const onTopTabChange = (t: ShopTab) => {
    if (t === 'home') setTab('shop');
    else if (t === 'rewards') setTab('giveaways');
    else if (t === 'manage') setTab('manage');
  };

  // While gate loads, avoid flicker
  if (canManage === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0c0c0c',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: '#0c0c0c',
          padding: BasePaddingsMargins.m15,
        }}
      >
        {/* Big top tabs (same look as Home) */}
        <ShopSubNavigation
          active={toShopTab(tab)}
          onChange={onTopTabChange}
          isMaster={!!canManage}
        />

        {/* SHOP placeholder */}
        {tab === 'shop' && (
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: BaseColors.secondary,
              borderRadius: 12,
              padding: BasePaddingsMargins.m15,
              backgroundColor: BaseColors.dark,
              marginTop: BasePaddingsMargins.m15,
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
            }}
          >
            <Text
              style={{
                color: BaseColors.othertexts,
                fontSize: 44,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              Shop is coming soon with{' '}
              <Text
                style={{ color: '#0080FF', fontSize: 52, fontWeight: '900' }}
              >
                awesome
              </Text>{' '}
              <Text
                style={{ color: '#0080FF', fontSize: 52, fontWeight: '900' }}
              >
                discounts
              </Text>{' '}
              and{' '}
              <Text
                style={{ color: '#0080FF', fontSize: 52, fontWeight: '900' }}
              >
                deals
              </Text>
              !
            </Text>
            <TouchableOpacity
              onPress={() => setShowSearchVenue(true)}
              style={{
                backgroundColor: BaseColors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Add Venue
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GIVEAWAYS (public) */}
        {tab === 'giveaways' && (
          <FlatList
            data={items}
            keyExtractor={(g) => g.id}
            renderItem={({ item }) => (
              <GiveawayPublicCard
                row={item}
                onEnter={() => showEnterGiveawayModal(item)}
                onView={showViewModal}
              />
            )}
            ListEmptyComponent={
              !loading ? (
                <View
                  style={{
                    paddingVertical: 40,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: BaseColors.secondary,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}
                  >
                    More giveaways coming soon
                  </Text>
                  <Text style={{ color: BaseColors.othertexts, marginTop: 6 }}>
                    Stay tuned for exciting new prizes and opportunities!
                  </Text>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{
              paddingBottom: 40,
              marginTop: BasePaddingsMargins.m15,
            }}
          />
        )}

        {/* MANAGE (admin only) */}
        {tab === 'manage' && !!canManage && (
          <FlatList
            data={mRows}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <ManageCard
                r={item}
                onPick={pickWinners}
                onEdit={setEditGiveaway}
                onDelete={deleteGiveaway}
                isMaster={isMaster}
              />
            )}
            refreshing={mLoading}
            onRefresh={loadManage}
            contentContainerStyle={{
              paddingBottom: 40,
              marginTop: BasePaddingsMargins.m15,
            }}
            ListHeaderComponent={
              <View>
                {/* ✅ QUICK ACTIONS FIRST */}
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: BaseColors.secondary,
                    borderRadius: 12,
                    padding: BasePaddingsMargins.m15,
                    backgroundColor: BaseColors.dark,
                    marginBottom: BasePaddingsMargins.m15,
                  }}
                >
                  <SectionTitle label="Quick Actions" />
                  {[
                    // ✅ opens the modal
                    {
                      label: 'Create New Giveaway',
                      onPress: () => setShowCreate(true),
                    },
                    {
                      label: 'View All Participants',
                      onPress: () => Alert.alert('Participants', 'Coming soon'),
                    },
                    {
                      label: 'Past Winners',
                      onPress: () => Alert.alert('Past Winners', 'Coming soon'),
                    },
                    {
                      label: 'Giveaway Settings',
                      onPress: () => Alert.alert('Settings', 'Coming soon'),
                    },
                  ].map((a, i) => (
                    <TouchableOpacity
                      key={`qa-${i}`}
                      onPress={a.onPress}
                      style={{
                        borderWidth: 1,
                        borderColor: BaseColors.secondary,
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: 'flex-start',
                        paddingHorizontal: 12,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* METRICS */}
                {metrics && (
                  <View style={{ marginTop: BasePaddingsMargins.m20 }}>
                    <SectionTitle label="Overview" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      <StatChip
                        label="Active Giveaways"
                        value={String(metrics.active_count)}
                      />
                      <StatChip
                        label="Total Entries"
                        value={String(metrics.total_entries)}
                      />
                      <StatChip
                        label="Total Prize Value"
                        value={`$${metrics.total_prize_value}`}
                      />
                    </View>
                  </View>
                )}

                <View style={{ marginTop: BasePaddingsMargins.m20 }}>
                  <SectionTitle label="Your Giveaways" />
                </View>
              </View>
            }
          />
        )}
      </View>

      {/* ✅ NEW: modals */}
      <ModalCreateGiveaway
        visible={showCreate}
        onClose={() => {
          setShowCreate(false);
          loadManage();
        }}
      />

      {editGiveaway && (
        <ModalEditGiveaway
          visible={!!editGiveaway}
          giveaway={editGiveaway}
          onClose={() => {
            setEditGiveaway(null);
            loadManage();
          }}
          onSave={async (updated) => {
            // Handle save logic here
            setEditGiveaway(null);
            loadManage();
          }}
        />
      )}

      {viewGiveaway && (
        <ModalViewGiveaway
          visible={viewModalVisible}
          giveaway={viewGiveaway}
          onClose={hideViewModal}
          onEnter={() => showEnterGiveawayModal(viewGiveaway)}
        />
      )}

      {enterGiveawaySelected && (
        <ModalEnterGiveaway
          visible={enterGiveawayModalVisible}
          giveaway={enterGiveawaySelected}
          onClose={hideEnterGiveawayModal}
          onAgree={handleEnterGiveawayAgree}
        />
      )}

      {/* ✅ NEW: venue modals */}
      <ModalSearchVenue
        visible={showSearchVenue}
        onClose={() => setShowSearchVenue(false)}
        onSelectVenue={handleSelectVenue}
        onCreateNew={handleCreateNewVenue}
      />

      <ModalCreateVenue
        visible={showCreateVenue}
        onClose={() => setShowCreateVenue(false)}
        onCreated={() => setShowCreateVenue(false)}
      />
    </>
  );
}
