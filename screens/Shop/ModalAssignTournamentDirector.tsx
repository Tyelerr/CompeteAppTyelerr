import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import { FetchUsersV2, UpdateProfile } from '../../ApiSupabase/CrudUser';
import { addTournamentDirectorToVenue } from '../../ApiSupabase/CrudVenues';
import { ICAUserData, EUserRole } from '../../hooks/InterfacesGlobal';
import { useContextAuth } from '../../context/ContextAuth';

interface ModalAssignTournamentDirectorProps {
  visible: boolean;
  onClose: () => void;
  onAssigned: () => void;
  venueId: number;
  venueName: string;
}

const ModalAssignTournamentDirector: React.FC<
  ModalAssignTournamentDirectorProps
> = ({ visible, onClose, onAssigned, venueId, venueName }) => {
  const { user } = useContextAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ICAUserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUserForConfirm, setSelectedUserForConfirm] =
    useState<ICAUserData | null>(null);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setUsers([]);
      setAssigning(null);
      setShowConfirmModal(false);
      setSelectedUserForConfirm(null);
    }
  }, [visible]);

  useEffect(() => {
    if (search.trim().length > 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [search]);

  const searchUsers = async () => {
    if (!search.trim() || search.trim().length < 3) return;

    setLoading(true);
    try {
      const { data } = await FetchUsersV2(
        user as ICAUserData,
        search.trim(),
        undefined,
        '',
        false, // Don't include deleted users
      );
      const userArray: ICAUserData[] = Array.isArray(data) ? (data as any) : [];
      setUsers(userArray);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const confirmAssignTournamentDirector = (selectedUser: ICAUserData) => {
    if (!selectedUser || assigning) return;

    // Check if user is Master Administrator or Compete Admin - they shouldn't be assigned as TD
    if (
      selectedUser.role === EUserRole.MasterAdministrator ||
      selectedUser.role === EUserRole.CompeteAdmin
    ) {
      Alert.alert(
        'Cannot Assign',
        `${capitalizeProfileName(
          selectedUser.user_name || selectedUser.name,
        )} is a ${getRoleDisplayName(
          selectedUser.role,
        )} and already has full administrative access. They do not need to be assigned as a Tournament Director.`,
      );
      return;
    }

    setSelectedUserForConfirm(selectedUser);
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
  };

  const assignTournamentDirector = async (selectedUser: ICAUserData) => {
    if (!selectedUser || assigning) return;

    setAssigning(selectedUser.id_auto);

    try {
      console.log('Assigning Tournament Director:', {
        userId: selectedUser.id_auto,
        venueId,
        currentRole: selectedUser.role,
      });

      // Determine if we need to upgrade the user's role
      let roleUpgradeMessage = '';

      // Only update user role to Tournament Director if they're a BasicUser
      if (selectedUser.role === EUserRole.BasicUser) {
        const updateResult = await UpdateProfile(selectedUser.id, {
          role: EUserRole.TournamentDirector,
        });

        if (!updateResult.success) {
          throw new Error('Failed to update user role to Tournament Director');
        }
        roleUpgradeMessage =
          ' Their role has been upgraded to Tournament Director.';
      } else if (selectedUser.role === EUserRole.BarAdmin) {
        // Bar Admin keeps their role but gets TD access to this venue
        roleUpgradeMessage =
          ' They will maintain their Bar Admin role while also having Tournament Director access to this venue.';
      } else if (selectedUser.role === EUserRole.TournamentDirector) {
        // Already a TD, just adding this venue to their list
        roleUpgradeMessage =
          ' This venue has been added to their Tournament Director venues.';
      }

      // Add the user to the venue_tournament_directors junction table
      const result = await addTournamentDirectorToVenue(
        selectedUser.id_auto,
        venueId,
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Successfully assigned ${capitalizeProfileName(
            selectedUser.user_name || selectedUser.name,
          )} as Tournament Director for ${venueName}.${roleUpgradeMessage}`,
        );

        onAssigned();
        onClose();
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

  const getRoleBadgeColor = (role: EUserRole) => {
    switch (role) {
      case EUserRole.BasicUser:
        return { bg: '#10b98122', border: '#10b98166', text: '#10b981' };
      case EUserRole.TournamentDirector:
        return { bg: '#3b82f622', border: '#3b82f666', text: '#3b82f6' };
      case EUserRole.BarAdmin:
        return { bg: '#7c3aed22', border: '#7c3aed66', text: '#7c3aed' };
      default:
        return { bg: '#6b728022', border: '#6b728066', text: '#6b7280' };
    }
  };

  const getRoleDisplayName = (role: EUserRole) => {
    switch (role) {
      case EUserRole.BasicUser:
        return 'Basic User';
      case EUserRole.TournamentDirector:
        return 'Tournament Director';
      case EUserRole.BarAdmin:
        return 'Bar Admin';
      case EUserRole.CompeteAdmin:
        return 'Compete Admin';
      case EUserRole.MasterAdministrator:
        return 'Master Admin';
      default:
        return role;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-start',
          paddingTop: 60,
          padding: 18,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: '#141416',
            borderWidth: 1,
            borderColor: BaseColors.PanelBorderColor,
            borderRadius: 14,
            padding: 16,
            maxHeight: '80%',
            width: '100%',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: '800',
              fontSize: 18,
              marginBottom: 8,
            }}
          >
            Assign Tournament Director
          </Text>

          <Text
            style={{
              color: '#9ca3af',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Search for users to assign as Tournament Director for {venueName}
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Type at least 3 characters to search..."
            placeholderTextColor="#6b7280"
            style={{
              color: 'white',
              borderWidth: 1,
              borderColor: BaseColors.PanelBorderColor,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              marginBottom: 16,
              backgroundColor: '#16171a',
              fontSize: 16,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView style={{ maxHeight: 400 }}>
            {users.length > 0 ? (
              users.map((item) => {
                const isAssigning = assigning === item.id_auto;
                const roleColors = getRoleBadgeColor(item.role);

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
                      padding: 14,
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                      backgroundColor: isAssigning ? '#1e3a8a' : '#1a1a1c',
                      marginBottom: 10,
                      borderRadius: 10,
                      opacity: isAssigning ? 0.7 : 1,
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      {/* User Avatar */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: '#333',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '700' }}>
                          {(item.user_name || item.name || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: 16,
                          }}
                        >
                          {capitalizeProfileName(item.user_name || item.name)}
                        </Text>

                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: '#9ca3af',
                              fontSize: 12,
                              marginRight: 8,
                            }}
                          >
                            ID: {formatUserId(item.id_auto)}
                          </Text>

                          {/* Role Badge */}
                          <View
                            style={{
                              backgroundColor: roleColors.bg,
                              borderWidth: 1,
                              borderColor: roleColors.border,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                color: roleColors.text,
                                fontSize: 10,
                                fontWeight: '700',
                              }}
                            >
                              {getRoleDisplayName(item.role)}
                            </Text>
                          </View>
                        </View>

                        {item.email && (
                          <Text
                            style={{
                              color: '#9ca3af',
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
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
            ) : search.trim().length > 2 && !loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                  No users found matching "{search}"
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                  Try searching by username, name, or email
                </Text>
              </View>
            ) : search.trim().length > 0 && search.trim().length <= 2 ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                  Type at least 3 characters to search
                </Text>
              </View>
            ) : search.trim().length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                  Start typing to search for users...
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                  Search by username, name, or email
                </Text>
              </View>
            ) : null}

            {loading && (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Text style={{ color: '#3b82f6', fontSize: 14 }}>
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
                backgroundColor: '#6b7280',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

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
              borderColor: BaseColors.PanelBorderColor,
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
                    User:{' '}
                  </Text>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {capitalizeProfileName(
                      selectedUserForConfirm.user_name ||
                        selectedUserForConfirm.name,
                    )}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ color: '#3b82f6', fontWeight: '700' }}>
                    User ID:{' '}
                  </Text>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {formatUserId(selectedUserForConfirm.id_auto)}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <Text style={{ color: '#3b82f6', fontWeight: '700' }}>
                    Current Role:{' '}
                  </Text>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {getRoleDisplayName(selectedUserForConfirm.role)}
                  </Text>
                </View>

                <Text
                  style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    textAlign: 'center',
                    marginBottom: 12,
                  }}
                >
                  Are you sure you want to assign this user as Tournament
                  Director for {venueName}?
                </Text>

                {/* Role-specific messages */}
                {selectedUserForConfirm.role === EUserRole.BasicUser && (
                  <Text
                    style={{
                      color: '#f59e0b',
                      fontWeight: '700',
                      fontSize: 13,
                      textAlign: 'center',
                      backgroundColor: '#f59e0b22',
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#f59e0b66',
                    }}
                  >
                    ⚠️ Their role will be upgraded to Tournament Director
                  </Text>
                )}

                {selectedUserForConfirm.role ===
                  EUserRole.TournamentDirector && (
                  <Text
                    style={{
                      color: '#3b82f6',
                      fontWeight: '600',
                      fontSize: 13,
                      textAlign: 'center',
                      backgroundColor: '#3b82f622',
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#3b82f666',
                    }}
                  >
                    ℹ️ This venue will be added to their existing Tournament
                    Director venues
                  </Text>
                )}

                {selectedUserForConfirm.role === EUserRole.BarAdmin && (
                  <Text
                    style={{
                      color: '#7c3aed',
                      fontWeight: '600',
                      fontSize: 13,
                      textAlign: 'center',
                      backgroundColor: '#7c3aed22',
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#7c3aed66',
                    }}
                  >
                    ℹ️ They will maintain their Bar Admin role and gain
                    Tournament Director access to this venue
                  </Text>
                )}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
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
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

export default ModalAssignTournamentDirector;
