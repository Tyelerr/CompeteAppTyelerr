// screens/Admin/ScreenAdminUsers.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenScrollView from '../ScreenScrollView';
import ScreenAdminDropdownNavigation from './ScreenAdminDropdownNavigation';
import UIPanel from '../../components/UI/UIPanel';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import ModalInfoMessage from '../../components/UI/UIModal/ModalInfoMessage';

import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { TIMEOUT_DELAY_WHEN_SEARCH } from '../../hooks/constants';
import {
  EUserRole,
  ICAUserData,
  UserRoles,
} from '../../hooks/InterfacesGlobal';
import { useContextAuth } from '../../context/ContextAuth';

import {
  FetchUsersV2,
  UpdateProfile,
  DeleteUser,
  checkUsernameAvailability,
  checkEmailAvailability,
} from '../../ApiSupabase/CrudUser';
import {
  assignVenueToUser,
  assignTournamentDirectorToVenue,
  fetchVenues,
} from '../../ApiSupabase/CrudVenues';
import { IVenue } from '../../hooks/InterfacesGlobal';
import { US_STATES } from '../../hooks/constants';
import {
  AdminCreateUser,
  AdminUpdateUserRole,
} from '../../ApiSupabase/AdminAuthHelpers';
import { validateUsername as validateUsernameContent } from '../../utils/ContentFilter';
import ModalCreateUser from './ModalCreateUser';
import ModalSearchVenue from '../Shop/ModalSearchVenue';
import ModalCreateVenue from '../Shop/ModalCreateVenue';

/* ---------- helpers ---------- */
const ROLE_LABEL: Record<EUserRole, string> = {
  [EUserRole.BasicUser]: 'Basic User',
  [EUserRole.CompeteAdmin]: 'Compete Admin',
  [EUserRole.BarAdmin]: 'Bar Owner',
  [EUserRole.TournamentDirector]: 'Tournament Director',
  [EUserRole.MasterAdministrator]: 'Master Admin',
};

// sorting
type SortBy = 'role-az' | 'role-za' | 'hierarchy';
const ROLE_ORDER: Partial<Record<EUserRole, number>> = {
  [EUserRole.MasterAdministrator]: 1,
  [EUserRole.CompeteAdmin]: 2,
  [EUserRole.BarAdmin]: 3,
  [EUserRole.TournamentDirector]: 4,
  [EUserRole.BasicUser]: 9,
};

const fmtDate = (iso?: string) =>
  !iso
    ? ''
    : new Date(iso).toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });

const initials = (name?: string) =>
  (name || '')
    .trim()
    .split(/\s|_/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'US';

const venuesCountOf = (u: any) =>
  u?.venues_count ?? (Array.isArray(u?.venues) ? u.venues.length : 0);
const directorsCountOf = (u: any) =>
  u?.directors_count ?? (Array.isArray(u?.directors) ? u.directors.length : 0);
const tournamentDirectorsCountOf = (u: any) =>
  u?.tournament_directors_count ?? 0;
const formatUserId = (n?: number | null) =>
  n == null ? '' : String(n).padStart(6, '0');

/* ---------- small chips ---------- */
function RoleChip({ role }: { role: EUserRole }) {
  const color =
    role === EUserRole.CompeteAdmin
      ? '#3b82f6'
      : role === EUserRole.BarAdmin
      ? '#7c3aed'
      : role === EUserRole.TournamentDirector
      ? '#06b6d4'
      : role === EUserRole.MasterAdministrator
      ? '#f59e0b'
      : '#374151';
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color + '66',
        backgroundColor: color + '22',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color, fontWeight: '700' }}>{ROLE_LABEL[role]}</Text>
    </View>
  );
}
function Badge({ text, prefix }: { text: string; prefix?: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: BaseColors.PanelBorderColor,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#1b1c20',
      }}
    >
      <Text style={{ color: '#9ca3af', fontWeight: '700' }}>
        {prefix ? `${prefix} ` : ''}
        {text}
      </Text>
    </View>
  );
}

function VenueBadge({ count }: { count: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#7c3aed66',
        backgroundColor: '#7c3aed22',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Ionicons
        name="business"
        size={12}
        color="#7c3aed"
        style={{ marginRight: 4 }}
      />
      <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 12 }}>
        {count} venue{count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

function TournamentDirectorVenueBadge({ count }: { count: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#06b6d466',
        backgroundColor: '#06b6d422',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Ionicons
        name="location"
        size={12}
        color="#06b6d4"
        style={{ marginRight: 4 }}
      />
      <Text style={{ color: '#06b6d4', fontWeight: '700', fontSize: 12 }}>
        {count} venue{count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

function TournamentDirectorsBadge({ count }: { count: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#06b6d466',
        backgroundColor: '#06b6d422',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Ionicons
        name="people"
        size={12}
        color="#06b6d4"
        style={{ marginRight: 4 }}
      />
      <Text style={{ color: '#06b6d4', fontWeight: '700', fontSize: 12 }}>
        {count} TD{count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}
function SortPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: BaseColors.PanelBorderColor,
        marginRight: 8,
        backgroundColor: active ? '#0ea5e9' : 'transparent',
      }}
    >
      <Text style={{ color: active ? '#000' : '#ddd', fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- EDIT PROFILE MODAL ---------- */
function EditUserProfileModal({
  visible,
  user,
  onClose,
  onSaved,
}: {
  visible: boolean;
  user: ICAUserData | null;
  onClose: () => void;
  onSaved: (partial: Partial<ICAUserData>) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [zipKey, setZipKey] = useState<string>('home_zip');
  const [password, setPassword] = useState<string>('');
  const [requirePasswordUpdate, setRequirePasswordUpdate] =
    useState<boolean>(false);
  const ZIP_KEYS = [
    'home_zip',
    'home_zip_code',
    'zip_home',
    'zip_code',
    'zipcode',
  ];

  useEffect(() => {
    if (!user) return;

    const detectedZipKey =
      ZIP_KEYS.find((k) =>
        Object.prototype.hasOwnProperty.call(user as any, k),
      ) ?? 'home_zip';
    setZipKey(detectedZipKey);

    setForm({
      user_name: user.user_name ?? user.name ?? '',
      name: user.name ?? '',
      zip_value: (user as any)[detectedZipKey] ?? '',
      favorite_player: (user as any).favorite_player ?? '',
      favorite_game: (user as any).favorite_game ?? '',
      role: String(user.role),
    });
    setPassword('');
    setRequirePasswordUpdate(false);
  }, [user]);

  if (!user) return null;

  const setField = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const updates: any = {
      user_name: form.user_name ?? '',
      name: form.name ?? '',
      favorite_player: form.favorite_player ?? '',
      favorite_game: form.favorite_game ?? '',
      [zipKey]: form.zip_value ?? '',
      role: form.role as EUserRole,
    };
    if (password.trim() !== '') {
      updates.password = password.trim();
    }
    if (requirePasswordUpdate) {
      updates.require_password_update = true;
    }
    await UpdateProfile(user.id, updates);
    onSaved(updates);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          padding: 18,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            backgroundColor: '#141416',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 14,
            padding: 16,
            maxHeight: '90%',
            width: '100%',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
            Edit Profile
          </Text>

          <View style={{ height: 12 }} />

          <LFInput
            label="Username"
            placeholder="Enter username"
            value={form.user_name}
            onChangeText={(t: string) => setField('user_name', t)}
            marginBottomInit={10}
          />
          <LFInput
            label="Name"
            placeholder="Full name"
            value={form.name}
            onChangeText={(t: string) => setField('name', t)}
            marginBottomInit={10}
          />
          <LFInput
            label="Home Zip Code"
            placeholder="Enter your zip code"
            value={form.zip_value}
            onChangeText={(t: string) => setField('zip_value', t)}
            marginBottomInit={10}
          />
          <LFInput
            label="Favorite Player"
            placeholder="Enter your favorite player"
            value={form.favorite_player}
            onChangeText={(t: string) => setField('favorite_player', t)}
            marginBottomInit={10}
          />
          <LFInput
            label="Favorite Game"
            placeholder="Enter your favorite game"
            value={form.favorite_game}
            onChangeText={(t: string) => setField('favorite_game', t)}
            marginBottomInit={10}
          />
          <LFInput
            typeInput="dropdown"
            label="Role"
            placeholder="Select role"
            value={form.role}
            items={UserRoles}
            onChangeText={(v: string) => setField('role', v)}
            marginBottomInit={16}
          />
          {(user?.role === EUserRole.MasterAdministrator ||
            user?.role === EUserRole.CompeteAdmin) && (
            <>
              <LFInput
                label="Set Password"
                placeholder="Enter new password"
                value={password}
                onChangeText={(t: string) => setPassword(t)}
                typeInput="default"
                keyboardType="default"
                marginBottomInit={10}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Pressable
                  onPress={() =>
                    setRequirePasswordUpdate(!requirePasswordUpdate)
                  }
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    backgroundColor: requirePasswordUpdate
                      ? '#3b82f6'
                      : 'transparent',
                    marginRight: 8,
                    borderRadius: 4,
                  }}
                />
                <Text style={{ color: 'white' }}>Require Updated Password</Text>
              </View>
            </>
          )}

          {/* Buttons row: SAVE (left) | CANCEL (right) */}
          <View style={{ flexDirection: 'row' }}>
            <Pressable
              onPress={handleSave}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: '#3b82f6', // blue save
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000', fontWeight: '800' }}>
                Save Changes
              </Text>
            </Pressable>

            <View style={{ width: 10 }} />

            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: '#b91c1c', // red cancel
                borderWidth: 1,
                borderColor: '#7a1f1f',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800' }}>Cancel</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ---------- DETAILS SHEET (pop out) ---------- */
function UserDetailsSheet({
  visible,
  user,
  onClose,
  onChangeRole,
  onAddVenue,
  onAddDirector,
  onDelete,
  onEdit, // NEW
}: {
  visible: boolean;
  user: ICAUserData | null;
  onClose: () => void;
  onChangeRole: (id: string, role: EUserRole) => void;
  onAddVenue: (user: ICAUserData) => void;
  onAddDirector: (id: string) => void;
  onDelete: (u: ICAUserData) => void;
  onEdit: (u: ICAUserData) => void;
}) {
  if (!user) return null;
  const venuesCount = venuesCountOf(user);
  const directorsCount = directorsCountOf(user);
  const tournamentDirectorsCount = tournamentDirectorsCountOf(user);

  const Row = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ color: 'white', fontWeight: '700' }}>{value ?? '—'}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      {/* dim background - tap to close */}
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* bottom sheet */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            marginTop: 'auto',
            backgroundColor: '#141416',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderColor: BaseColors.PanelBorderColor,
            borderWidth: 1,
            paddingBottom: 24,
            maxHeight: '85%',
          }}
        >
          {/* header */}
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: BaseColors.PanelBorderColor,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#222228',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: BaseColors.PanelBorderColor,
                marginRight: 12,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800' }}>
                {initials(user.user_name || user.name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: 'white', fontWeight: '800', fontSize: 16 }}
                numberOfLines={1}
              >
                {user.user_name || user.name || 'User'}
              </Text>
              <View
                style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}
              >
                <Badge text={`User ID: ${formatUserId(user.id_auto)}`} />
                {user.created_at ? <View style={{ width: 8 }} /> : null}
                {user.created_at ? (
                  <Badge text={`Joined ${fmtDate(user.created_at)}`} />
                ) : null}
              </View>
            </View>

            {/* NEW: quick edit icon in the sheet header */}
            <Pressable
              onPress={() => onEdit(user)}
              hitSlop={10}
              style={{ marginRight: 10 }}
            >
              <Ionicons name="create-outline" size={22} color="#9ca3af" />
            </Pressable>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color="#9ca3af" />
            </Pressable>
          </View>

          {/* content */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* role + counts */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <RoleChip role={user.role} />
              {venuesCount ? <View style={{ width: 8 }} /> : null}
              {venuesCount ? (
                user.role === EUserRole.BarAdmin ? (
                  <VenueBadge count={venuesCount} />
                ) : user.role === EUserRole.TournamentDirector ? (
                  <TournamentDirectorVenueBadge count={venuesCount} />
                ) : (
                  <VenueBadge count={venuesCount} />
                )
              ) : null}
              {user.role === EUserRole.BarAdmin && tournamentDirectorsCount ? (
                <View style={{ width: 8 }} />
              ) : null}
              {user.role === EUserRole.BarAdmin && tournamentDirectorsCount ? (
                <TournamentDirectorsBadge count={tournamentDirectorsCount} />
              ) : null}
              {directorsCount ? <View style={{ width: 8 }} /> : null}
              {directorsCount ? (
                <Badge prefix="👤" text={String(directorsCount)} />
              ) : null}
            </View>

            <View style={{ height: 16 }} />

            {/* fields */}
            <Row label="Email" value={user.email} />
            <Row label="Username" value={user.user_name || user.name} />
            <Row label="Role" value={ROLE_LABEL[user.role]} />
            <Row label="Created" value={fmtDate(user.created_at)} />
            <Row label="UUID" value={user.id} />

            {/* danger zone */}
            <View style={{ marginTop: 18, alignItems: 'center' }}>
              <Pressable
                onPress={() => onDelete(user)}
                accessibilityRole="button"
                style={{
                  backgroundColor: '#b91c1c',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#7a1f1f',
                  minWidth: 160,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ---------- user card (full / role-only) ---------- */
function UserCard({
  u,
  compact,
  onOpenDetails,
  onChangeRole,
  onAddVenue,
  onAddDirector,
  onAssignTournamentDirector,
  onDelete,
  onEdit, // NEW
}: {
  u: ICAUserData;
  compact: boolean;
  onOpenDetails: (u: ICAUserData) => void;
  onChangeRole: (id: string, role: EUserRole) => void;
  onAddVenue: (user: ICAUserData) => void;
  onAddDirector: (id: string) => void;
  onAssignTournamentDirector: (user: ICAUserData) => void;
  onDelete: (u: ICAUserData) => void;
  onEdit: (u: ICAUserData) => void;
}) {
  const [roleOpen, setRoleOpen] = useState(false);
  const venuesCount = venuesCountOf(u);
  const directorsCount = directorsCountOf(u);
  const tournamentDirectorsCount = tournamentDirectorsCountOf(u);

  return (
    <View
      style={{
        backgroundColor: '#161618',
        borderColor: BaseColors.PanelBorderColor,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: BasePaddingsMargins.m15,
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* tap avatar/name to open details */}
        <Pressable
          onPress={() => onOpenDetails(u)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#222228',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              marginRight: 12,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>
              {initials(u.user_name || u.name)}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ color: 'white', fontSize: 16, fontWeight: '800' }}
              numberOfLines={1}
            >
              {u.user_name || u.name || 'User'}
            </Text>

            {!compact ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: 4,
                  }}
                >
                  <Badge text={`User ID: ${formatUserId(u.id_auto)}`} />
                  {u.created_at ? <View style={{ width: 8 }} /> : null}
                  {u.created_at ? (
                    <Badge text={`Joined ${fmtDate(u.created_at)}`} />
                  ) : null}
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: 8,
                  }}
                >
                  <RoleChip role={u.role} />
                  {venuesCount ? <View style={{ width: 8 }} /> : null}
                  {venuesCount ? (
                    u.role === EUserRole.BarAdmin ? (
                      <VenueBadge count={venuesCount} />
                    ) : u.role === EUserRole.TournamentDirector ? (
                      <TournamentDirectorVenueBadge count={venuesCount} />
                    ) : (
                      <VenueBadge count={venuesCount} />
                    )
                  ) : null}
                  {u.role === EUserRole.BarAdmin && tournamentDirectorsCount ? (
                    <View style={{ width: 8 }} />
                  ) : null}
                  {u.role === EUserRole.BarAdmin && tournamentDirectorsCount ? (
                    <TournamentDirectorsBadge
                      count={tournamentDirectorsCount}
                    />
                  ) : null}
                  {directorsCount ? <View style={{ width: 8 }} /> : null}
                  {directorsCount ? (
                    <Badge prefix="👤" text={String(directorsCount)} />
                  ) : null}
                </View>

                {u.email ? (
                  <Text
                    style={{
                      color: '#9ca3af',
                      marginTop: 4,
                      fontSize: TextsSizes.small,
                    }}
                    numberOfLines={1}
                  >
                    {u.email}
                  </Text>
                ) : null}
              </>
            ) : (
              // role-only row (tap anywhere left area to open details)
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <RoleChip role={u.role} />
                {venuesCount ? <View style={{ width: 8 }} /> : null}
                {venuesCount ? (
                  u.role === EUserRole.BarAdmin ? (
                    <VenueBadge count={venuesCount} />
                  ) : u.role === EUserRole.TournamentDirector ? (
                    <TournamentDirectorVenueBadge count={venuesCount} />
                  ) : (
                    <VenueBadge count={venuesCount} />
                  )
                ) : null}
                {directorsCount ? <View style={{ width: 8 }} /> : null}
                {directorsCount ? (
                  <Badge prefix="👤" text={String(directorsCount)} />
                ) : null}
              </View>
            )}
          </View>
        </Pressable>

        {/* right-side icons */}
        {compact ? (
          <View style={{ flexDirection: 'row', marginLeft: 8 }}>
            {/* NEW: pencil on compact */}
            <Pressable
              onPress={() => onEdit(u)}
              hitSlop={10}
              accessibilityRole="button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                marginRight: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1b2130',
                borderWidth: 1,
                borderColor: '#26354f',
              }}
            >
              <Ionicons name="create-outline" size={18} color="#93c5fd" />
            </Pressable>

            <Pressable
              onPress={() => onDelete(u)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Delete user"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#221416',
                borderWidth: 1,
                borderColor: '#7a1f1f',
              }}
            >
              <Ionicons name="trash" size={18} color="#ef4444" />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* full controls */}
      {!compact && (
        <View style={{ marginTop: 12 }}>
          <View
            style={{ flexDirection: 'row', marginTop: 0, flexWrap: 'wrap' }}
          >
            {u.role === EUserRole.BarAdmin && (
              <>
                <LFButton
                  type="secondary"
                  label="Add Venue"
                  onPress={() => onAddVenue(u)}
