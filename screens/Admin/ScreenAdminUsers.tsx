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
    // CRITICAL FIX: Ensure role is the actual enum value, not a string representation
    // The form.role comes from the dropdown which should already be the correct enum value
    // But we need to make sure it's not accidentally using a label or wrong format
    const roleValue = form.role as EUserRole;

    const updates: any = {
      user_name: form.user_name ?? '',
      name: form.name ?? '',
      favorite_player: form.favorite_player ?? '',
      favorite_game: form.favorite_game ?? '',
      [zipKey]: form.zip_value ?? '',
      role: roleValue, // Use the enum value directly
    };
    if (password.trim() !== '') {
      updates.password = password.trim();
    }
    if (requirePasswordUpdate) {
      updates.require_password_update = true;
    }

    console.log('EditUserProfileModal: Saving user with role:', roleValue);
    console.log('EditUserProfileModal: Role type:', typeof roleValue);

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
                />
                <View style={{ width: 10 }} />
                <LFButton
                  type="secondary"
                  label="Add Tournament Director"
                  onPress={() => onAssignTournamentDirector(u)}
                />
                <View style={{ width: 10 }} />
              </>
            )}
            {u.role === EUserRole.TournamentDirector && (
              <>
                <LFButton
                  type="secondary"
                  label="Add Venue"
                  onPress={() => onAddVenue(u)}
                />
                <View style={{ width: 10 }} />
              </>
            )}

            {/* NEW: edit button for full view */}
            <LFButton type="secondary" label="Edit" onPress={() => onEdit(u)} />
            <View style={{ width: 10 }} />

            <LFButton
              type="danger"
              label="Delete"
              onPress={() => onDelete(u)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------- ASSIGN TOURNAMENT DIRECTOR MODAL ---------- */
function AssignTournamentDirectorModal({
  visible,
  user,
  currentUser,
  onClose,
  onAssign,
}: {
  visible: boolean;
  user: ICAUserData | null;
  currentUser: ICAUserData | null;
  onClose: () => void;
  onAssign: (userId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ICAUserData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setUsers([]);
    }
  }, [visible]);

  useEffect(() => {
    if (search.trim().length > 0) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [search]);

  const searchUsers = async () => {
    if (!search.trim() || !currentUser) return;

    setLoading(true);
    try {
      const { data } = await FetchUsersV2(
        currentUser,
        search.trim(),
        undefined,
        '',
        false, // Don't include deleted users
      );
      const userArray: ICAUserData[] = Array.isArray(data) ? (data as any) : [];
      setUsers(userArray);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const capitalizeProfileName = (name?: string) => {
    if (!name) return 'User';
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-start',
          paddingTop: 180,
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
            maxHeight: '70%',
            width: '100%',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: '800',
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            Assign Tournament Director
          </Text>

          <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
            Search Tournament Director for {user.user_name || user.name}
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by username or ID..."
            placeholderTextColor="#6b7280"
            style={{
              color: 'white',
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 16,
              backgroundColor: '#16171a',
            }}
          />

          <ScrollView style={{ maxHeight: 300 }}>
            {users.length > 0 ? (
              users.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    onAssign(String(item.id));
                    onClose();
                  }}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: BaseColors.PanelBorderColor,
                    backgroundColor: '#16171a',
                    marginBottom: 8,
                    borderRadius: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#222228',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: 'white',
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {initials(item.user_name || item.name)}
                      </Text>
                    </View>
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
                  </View>
                </TouchableOpacity>
              ))
            ) : search.trim().length > 0 && !loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  No users found matching "{search}"
                </Text>
              </View>
            ) : search.trim().length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  Start typing to search for users...
                </Text>
              </View>
            ) : null}

            {loading && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  Searching...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Buttons row */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <TouchableOpacity
              onPress={onClose}
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
              <Text style={{ color: 'white', fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ---------- MAIN SCREEN ---------- */
export default function ScreenAdminUsers() {
  const { user: currentUser } = useContextAuth();
  const [users, setUsers] = useState<ICAUserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ICAUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('hierarchy');
  const [compactView, setCompactView] = useState(false);

  // modals
  const [selectedUser, setSelectedUser] = useState<ICAUserData | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [assignVenueVisible, setAssignVenueVisible] = useState(false);
  const [assignTDVisible, setAssignTDVisible] = useState(false);
  const [createUserVisible, setCreateUserVisible] = useState(false);
  const [createVenueVisible, setCreateVenueVisible] = useState(false);
  const [venueDataForCreation, setVenueDataForCreation] = useState<any>(null);

  // info modal
  const [infoModal, setInfoModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      filterAndSortUsers();
    }, TIMEOUT_DELAY_WHEN_SEARCH);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [users, searchText, sortBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const result = await FetchUsersV2(currentUser);
        if (result && result.data) {
          setUsers(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showInfoModal('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.user_name || '').toLowerCase().includes(search) ||
          (u.name || '').toLowerCase().includes(search) ||
          (u.email || '').toLowerCase().includes(search) ||
          String(u.id_auto || '').includes(search),
      );
    }

    // sort
    if (sortBy === 'role-az') {
      filtered.sort((a, b) =>
        ROLE_LABEL[a.role].localeCompare(ROLE_LABEL[b.role]),
      );
    } else if (sortBy === 'role-za') {
      filtered.sort((a, b) =>
        ROLE_LABEL[b.role].localeCompare(ROLE_LABEL[a.role]),
      );
    } else if (sortBy === 'hierarchy') {
      filtered.sort((a, b) => {
        const orderA = ROLE_ORDER[a.role] ?? 99;
        const orderB = ROLE_ORDER[b.role] ?? 99;
        return orderA - orderB;
      });
    }

    setFilteredUsers(filtered);
  };

  const showInfoModal = (title: string, message: string) => {
    setInfoModal({ visible: true, title, message });
  };

  const handleChangeRole = async (userId: string, newRole: EUserRole) => {
    try {
      const result = await AdminUpdateUserRole(userId, newRole);
      if (result.error) {
        throw new Error(result.error.message);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      showInfoModal(
        'Success',
        'User role updated successfully in both authentication and profile',
      );
    } catch (error) {
      console.error('Error updating role:', error);
      showInfoModal('Error', 'Failed to update user role');
    }
  };

  const handleAddVenue = (user: ICAUserData) => {
    setSelectedUser(user);
    setAssignVenueVisible(true);
  };

  const handleAssignVenue = async (venueId: string) => {
    if (!selectedUser) return;
    try {
      await assignVenueToUser(selectedUser.id_auto, parseInt(venueId));
      showInfoModal('Success', 'Venue assigned successfully');
      fetchUsers(); // refresh to show updated counts
    } catch (error) {
      console.error('Error assigning venue:', error);
      showInfoModal('Error', 'Failed to assign venue');
    }
  };

  const handleAssignTournamentDirector = (user: ICAUserData) => {
    setSelectedUser(user);
    setAssignTDVisible(true);
  };

  const handleAssignTD = async (tdId: string) => {
    if (!selectedUser) return;

    // First, get the venues owned by this bar owner
    try {
      const venues = await fetchVenues();
      const userVenues = venues.filter(
        (venue: any) => venue.barowner_id === selectedUser.id_auto,
      );

      if (userVenues.length === 0) {
        showInfoModal(
          'Error',
          'This user has no venues to assign tournament directors to. Please add a venue first.',
        );
        return;
      }

      // Find the selected user to get their id_auto (numeric ID)
      const selectedTD = users.find((u) => u.id === tdId);
      if (!selectedTD || !selectedTD.id_auto) {
        showInfoModal(
          'Error',
          'Selected tournament director not found or missing ID',
        );
        return;
      }

      // CRITICAL FIX: Update user's role to Tournament Director if they're a Basic User
      if (selectedTD.role === EUserRole.BasicUser) {
        console.log('Upgrading user role from Basic to Tournament Director');
        const roleUpdateResult = await AdminUpdateUserRole(
          selectedTD.id,
          EUserRole.TournamentDirector,
        );

        if (roleUpdateResult.error) {
          showInfoModal(
            'Error',
            'Failed to update user role to Tournament Director',
          );
          return;
        }

        // Update local state to reflect the role change
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedTD.id
              ? { ...u, role: EUserRole.TournamentDirector }
              : u,
          ),
        );
      }

      if (userVenues.length === 1) {
        // If only one venue, assign directly
        await assignTournamentDirectorToVenue(
          selectedTD.id_auto,
          userVenues[0].id,
        );
        showInfoModal(
          'Success',
          `Tournament Director assigned to ${userVenues[0].venue} successfully${
            selectedTD.role === EUserRole.BasicUser
              ? '. Their role has been upgraded to Tournament Director.'
              : ''
          }`,
        );
        fetchUsers(); // refresh to show updated counts
      } else {
        // If multiple venues, show venue selection (for now, assign to first venue)
        // TODO: Implement venue selection modal for multiple venues
        await assignTournamentDirectorToVenue(
          selectedTD.id_auto,
          userVenues[0].id,
        );
        showInfoModal(
          'Success',
          `Tournament Director assigned to ${userVenues[0].venue} successfully${
            selectedTD.role === EUserRole.BasicUser
              ? '. Their role has been upgraded to Tournament Director.'
              : ''
          }`,
        );
        fetchUsers(); // refresh to show updated counts
      }
    } catch (error) {
      console.error('Error assigning tournament director:', error);
      showInfoModal('Error', 'Failed to assign tournament director');
    }
  };

  const handleDeleteUser = async (user: ICAUserData) => {
    try {
      await DeleteUser(user);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showInfoModal('Success', 'User deleted successfully');
      setDetailsVisible(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      showInfoModal('Error', 'Failed to delete user');
    }
  };

  const handleEditUser = (user: ICAUserData) => {
    setSelectedUser(user);
    setEditVisible(true);
    setDetailsVisible(false);
  };

  const handleUserSaved = (updates: Partial<ICAUserData>) => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updates } : u)),
    );
    showInfoModal('Success', 'User updated successfully');
  };

  const handleCreateUser = () => {
    setCreateUserVisible(true);
  };

  const handleUserCreated = (newUser: ICAUserData) => {
    setUsers((prev) => [...prev, newUser]);
    setCreateUserVisible(false);
    showInfoModal('Success', 'User created successfully');
  };

  // Venue creation handlers
  const handleCreateNewVenue = () => {
    setAssignVenueVisible(false);
    setCreateVenueVisible(true);
  };

  const handleCreateVenueWithGoogleData = (venueData: any) => {
    setVenueDataForCreation(venueData);
    setAssignVenueVisible(false);
    setCreateVenueVisible(true);
  };

  const handleVenueCreated = async (newVenue: IVenue) => {
    setCreateVenueVisible(false);
    setVenueDataForCreation(null);

    // Assign the newly created venue to the selected user
    if (selectedUser && newVenue.id) {
      try {
        await assignVenueToUser(selectedUser.id_auto, newVenue.id);
        showInfoModal('Success', 'Venue created and assigned successfully');
        fetchUsers(); // refresh to show updated counts
      } catch (error) {
        console.error('Error assigning new venue:', error);
        showInfoModal('Error', 'Venue created but failed to assign to user');
      }
    }
  };

  const handleSelectExistingVenue = (venue: IVenue) => {
    setAssignVenueVisible(false);
    if (selectedUser && venue.id) {
      handleAssignVenue(String(venue.id));
    }
  };

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenAdminDropdownNavigation />

      <UIPanel>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text
            style={{ color: 'white', fontSize: 18, fontWeight: '800', flex: 1 }}
          >
            Users ({filteredUsers.length})
          </Text>
          <Pressable
            onPress={() => setCompactView(!compactView)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: compactView ? '#3b82f6' : '#374151',
              marginRight: 8,
            }}
          >
            <Text
              style={{
                color: compactView ? '#000' : '#fff',
                fontWeight: '700',
              }}
            >
              {compactView ? 'Full' : 'Compact'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCreateUser}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: '#10b981',
            }}
          >
            <Text style={{ color: '#000', fontWeight: '700' }}>+ User</Text>
          </Pressable>
        </View>

        {/* search */}
        <LFInput
          placeholder="Search users..."
          value={searchText}
          onChangeText={setSearchText}
          marginBottomInit={16}
        />

        {/* sort pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          <SortPill
            label="Hierarchy"
            active={sortBy === 'hierarchy'}
            onPress={() => setSortBy('hierarchy')}
          />
          <SortPill
            label="Role A-Z"
            active={sortBy === 'role-az'}
            onPress={() => setSortBy('role-az')}
          />
          <SortPill
            label="Role Z-A"
            active={sortBy === 'role-za'}
            onPress={() => setSortBy('role-za')}
          />
        </ScrollView>

        {/* users list */}
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              u={u}
              compact={compactView}
              onOpenDetails={(user) => {
                setSelectedUser(user);
                setDetailsVisible(true);
              }}
              onChangeRole={handleChangeRole}
              onAddVenue={handleAddVenue}
              onAddDirector={(id) => console.log('Add director:', id)}
              onAssignTournamentDirector={handleAssignTournamentDirector}
              onDelete={handleDeleteUser}
              onEdit={handleEditUser}
            />
          ))
        )}
      </UIPanel>

      {/* modals */}
      <UserDetailsSheet
        visible={detailsVisible}
        user={selectedUser}
        onClose={() => setDetailsVisible(false)}
        onChangeRole={handleChangeRole}
        onAddVenue={handleAddVenue}
        onAddDirector={(id) => console.log('Add director:', id)}
        onDelete={handleDeleteUser}
        onEdit={handleEditUser}
      />

      <EditUserProfileModal
        visible={editVisible}
        user={selectedUser}
        onClose={() => setEditVisible(false)}
        onSaved={handleUserSaved}
      />

      <ModalSearchVenue
        visible={assignVenueVisible}
        onClose={() => setAssignVenueVisible(false)}
        onCreateNew={handleCreateNewVenue}
        onCreateNewWithData={handleCreateVenueWithGoogleData}
        onSelectVenue={handleSelectExistingVenue}
      />

      <ModalCreateVenue
        visible={createVenueVisible}
        onClose={() => {
          setCreateVenueVisible(false);
          setVenueDataForCreation(null);
        }}
        onCreated={handleVenueCreated}
        prefilledData={venueDataForCreation}
        barownerId={selectedUser?.id_auto}
      />

      <AssignTournamentDirectorModal
        visible={assignTDVisible}
        user={selectedUser}
        currentUser={currentUser}
        onClose={() => setAssignTDVisible(false)}
        onAssign={handleAssignTD}
      />

      <Modal visible={createUserVisible} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 18,
          }}
          activeOpacity={1}
          onPress={() => setCreateUserVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: '#141416',
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              borderRadius: 14,
              padding: 0,
              height: '90%',
              width: '100%',
              maxWidth: 500,
            }}
          >
            {/* Header */}
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: BaseColors.PanelBorderColor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: '800',
                  fontSize: 18,
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                Create New User
              </Text>
              <Pressable
                onPress={() => setCreateUserVisible(false)}
                hitSlop={10}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                }}
              >
                <Ionicons name="close" size={24} color="#ef4444" />
              </Pressable>
            </View>

            {/* Form Content - Using the modal-specific ModalCreateUser component */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <ModalCreateUser
                onUserCreated={handleUserCreated}
                onClose={() => setCreateUserVisible(false)}
              />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={infoModal.visible} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'center',
            padding: 18,
          }}
          activeOpacity={1}
          onPress={() =>
            setInfoModal({ visible: false, title: '', message: '' })
          }
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
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontWeight: '800',
                fontSize: 16,
                marginBottom: 12,
              }}
            >
              {infoModal.title}
            </Text>
            <Text
              style={{
                color: '#9ca3af',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {infoModal.message}
            </Text>
            <Pressable
              onPress={() =>
                setInfoModal({ visible: false, title: '', message: '' })
              }
              style={{
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 10,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000', fontWeight: '800' }}>OK</Text>
            </Pressable>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenScrollView>
  );
}
