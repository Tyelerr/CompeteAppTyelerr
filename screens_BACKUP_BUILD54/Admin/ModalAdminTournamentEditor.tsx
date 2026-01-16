import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from 'react-native';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import UIModalCloseButton from '../../components/UI/UIModal/UIModalCloseButton';
import { ITournament } from '../../hooks/InterfacesGlobal';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import UIPanel from '../../components/UI/UIPanel';
import { format, parseISO } from 'date-fns';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LFInput from '../../components/LoginForms/LFInput';
import {
  UpdateTournament,
  DeleteTournament,
} from '../../ApiSupabase/CrudTournament';
import { useContextAuth } from '../../context/ContextAuth';

interface TournamentWithDetails extends ITournament {
  likes_count?: number;
}

export default function ModalAdminTournamentEditor({
  tournament,
  isOpened,
  F_isOpened,
  onTournamentUpdated,
  onTournamentDeleted,
}: {
  tournament?: TournamentWithDetails;
  isOpened: boolean;
  F_isOpened: (v: boolean) => void;
  onTournamentUpdated?: () => void;
  onTournamentDeleted?: () => void;
}) {
  const [editedTournament, setEditedTournament] = useState<
    Partial<ITournament>
  >({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { user } = useContextAuth();

  useEffect(() => {
    if (tournament && isOpened) {
      setEditedTournament({
        tournament_name: tournament.tournament_name,
        game_type: tournament.game_type,
        format: tournament.format,
        director_name: tournament.director_name,
        description: tournament.description,
        equipment: tournament.equipment,
        custom_equipment: tournament.custom_equipment,
        game_spot: tournament.game_spot,
        venue: tournament.venue,
        address: tournament.address,
        phone: tournament.phone,
        start_date: tournament.start_date,
        strart_time: tournament.strart_time,
        race_details: tournament.race_details,
        table_size: tournament.table_size,
        number_of_tables: tournament.number_of_tables,
        max_fargo: tournament.max_fargo,
        tournament_fee: tournament.tournament_fee,
        is_recurring: tournament.is_recurring,
        reports_to_fargo: tournament.reports_to_fargo,
        is_open_tournament: tournament.is_open_tournament,
      });
    }
  }, [tournament, isOpened]);

  const handleSave = async () => {
    if (!tournament) return;

    try {
      setLoading(true);

      const result = await UpdateTournament(tournament, editedTournament);

      if (result?.error) {
        console.error('Error updating tournament:', result.error);
        Alert.alert('Error', 'Failed to update tournament');
        return;
      }

      Alert.alert('Success', 'Tournament updated successfully');
      F_isOpened(false);
      if (onTournamentUpdated) {
        onTournamentUpdated();
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      Alert.alert('Error', 'Failed to update tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!tournament) return;

    Alert.alert(
      'Delete Tournament',
      `Are you sure you want to delete "${tournament.tournament_name}"? This will archive the tournament and all associated data. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);

              // Use the proper DeleteTournament function which archives the tournament
              const result = await DeleteTournament(
                tournament.id!,
                user?.id,
                'admin_deletion',
              );

              if (result.success) {
                Alert.alert(
                  'Success',
                  'Tournament has been deleted and archived successfully',
                );
                F_isOpened(false);
                if (onTournamentUpdated) {
                  onTournamentUpdated(); // Refresh the tournament list
                }
              } else {
                console.error('Error deleting tournament:', result.error);
                Alert.alert(
                  'Error',
                  result.error || 'Failed to delete tournament',
                );
              }
            } catch (error) {
              console.error('Error deleting tournament:', error);
              Alert.alert('Error', 'Failed to delete tournament');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const updateField = (field: keyof ITournament, value: any) => {
    setEditedTournament((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!tournament) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={isOpened}>
      <View style={[StyleModal.container]}>
        <TouchableOpacity
          style={[StyleModal.backgroundTouchableForClosing]}
          onPress={() => F_isOpened(false)}
        />

        <View style={[StyleModal.containerForScrollingView]}>
          <ScrollView style={[StyleModal.scrollView]}>
            <View style={[StyleModal.contentView]}>
              <UIModalCloseButton F_isOpened={F_isOpened} />

              {/* Header Section */}
              <View
                style={{
                  marginBottom: BasePaddingsMargins.m25,
                  paddingBottom: BasePaddingsMargins.m15,
                  borderBottomWidth: 1,
                  borderBottomColor: BaseColors.othertexts + '20',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: BasePaddingsMargins.m15,
                  }}
                >
                  <Text
                    style={[
                      StyleZ.h2,
                      { color: BaseColors.light, fontWeight: 'bold' },
                    ]}
                  >
                    Edit Tournament
                  </Text>
                  <View
                    style={{
                      backgroundColor: BaseColors.primary,
                      paddingHorizontal: BasePaddingsMargins.m10,
                      paddingVertical: BasePaddingsMargins.m5,
                      borderRadius: BasePaddingsMargins.m10,
                    }}
                  >
                    <Text
                      style={[
                        StyleZ.p,
                        { color: BaseColors.light, fontWeight: 'bold' },
                      ]}
                    >
                      ID: {tournament.id_unique_number}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Basic Information Panel */}
              <UIPanel>
                <Text style={[StyleZ.h3, { marginBottom: 15 }]}>
                  Basic Information
                </Text>

                <LFInput
                  keyboardType="default"
                  placeholder="Tournament Name"
                  iconFront="trophy"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.tournament_name || ''}
                  onChangeText={(text: string) =>
                    updateField('tournament_name', text)
                  }
                  validations={[]}
                />

                <LFInput
                  keyboardType="default"
                  placeholder="Game Type"
                  iconFront="game-controller"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.game_type || ''}
                  onChangeText={(text: string) =>
                    updateField('game_type', text)
                  }
                  validations={[]}
                />

                <LFInput
                  keyboardType="default"
                  placeholder="Format"
                  iconFront="list"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.format || ''}
                  onChangeText={(text: string) => updateField('format', text)}
                  validations={[]}
                />

                <LFInput
                  keyboardType="default"
                  placeholder="Tournament Director"
                  iconFront="person"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.director_name || ''}
                  onChangeText={(text: string) =>
                    updateField('director_name', text)
                  }
                  validations={[]}
                />

                <View style={{ marginBottom: BasePaddingsMargins.m15 }}>
                  <Text
                    style={{
                      color: BaseColors.othertexts,
                      fontSize: 14,
                      marginBottom: 5,
                    }}
                  >
                    Description
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: BaseColors.secondary,
                      borderRadius: 8,
                      padding: 12,
                      color: BaseColors.light,
                      minHeight: 80,
                      textAlignVertical: 'top',
                      borderWidth: 1,
                      borderColor: BaseColors.PanelBorderColor,
                    }}
                    multiline
                    placeholder="Tournament description..."
                    placeholderTextColor={BaseColors.othertexts}
                    value={editedTournament.description || ''}
                    onChangeText={(text) => updateField('description', text)}
                  />
                </View>

                <LFInput
                  keyboardType="numeric"
                  placeholder="Entry Fee"
                  iconFront="cash"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={
                    editedTournament.tournament_fee?.toString() || ''
                  }
                  onChangeText={(text: string) =>
                    updateField('tournament_fee', parseFloat(text) || 0)
                  }
                  validations={[]}
                />
              </UIPanel>

              {/* Venue Information Panel */}
              <UIPanel>
                <Text style={[StyleZ.h3, { marginBottom: 15 }]}>
                  Venue Information
                </Text>

                <LFInput
                  keyboardType="default"
                  placeholder="Venue Name"
                  iconFront="business"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.venue || ''}
                  onChangeText={(text: string) => updateField('venue', text)}
                  validations={[]}
                />

                <LFInput
                  keyboardType="default"
                  placeholder="Address"
                  iconFront="location"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.address || ''}
                  onChangeText={(text: string) => updateField('address', text)}
                  validations={[]}
                />

                <LFInput
                  keyboardType="phone-pad"
                  placeholder="Phone Number"
                  iconFront="call"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.phone || ''}
                  onChangeText={(text: string) => updateField('phone', text)}
                  validations={[]}
                />

                <LFInput
                  keyboardType="numeric"
                  placeholder="Number of Tables"
                  iconFront="grid"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={
                    editedTournament.number_of_tables?.toString() || ''
                  }
                  onChangeText={(text: string) =>
                    updateField('number_of_tables', parseInt(text) || 0)
                  }
                  validations={[]}
                />
              </UIPanel>

              {/* Tournament Settings Panel */}
              <UIPanel>
                <Text style={[StyleZ.h3, { marginBottom: 15 }]}>
                  Tournament Settings
                </Text>

                <LFInput
                  keyboardType="default"
                  placeholder="Equipment"
                  iconFront="construct"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.equipment || ''}
                  onChangeText={(text: string) =>
                    updateField('equipment', text)
                  }
                  validations={[]}
                />

                <LFInput
                  keyboardType="default"
                  placeholder="Race Details"
                  iconFront="flag"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.race_details || ''}
                  onChangeText={(text: string) =>
                    updateField('race_details', text)
                  }
                  validations={[]}
                />

                <LFInput
                  keyboardType="numeric"
                  placeholder="Max Fargo Rating"
                  iconFront="star"
                  marginBottomInit={BasePaddingsMargins.formInputMarginLess}
                  defaultValue={editedTournament.max_fargo?.toString() || ''}
                  onChangeText={(text: string) =>
                    updateField('max_fargo', parseInt(text) || 0)
                  }
                  validations={[]}
                />

                <LFInput
                  keyboardType="default"
                  placeholder="Game Spot"
                  iconFront="location"
                  marginBottomInit={0}
                  defaultValue={editedTournament.game_spot || ''}
                  onChangeText={(text: string) =>
                    updateField('game_spot', text)
                  }
                  validations={[]}
                />
              </UIPanel>

              {/* Action Buttons */}
              <LFButton
                label={loading ? 'Saving...' : 'Save Changes'}
                type="primary"
                marginbottom={BasePaddingsMargins.m10}
                onPress={handleSave}
                disabled={loading}
              />

              <LFButton
                label={deleting ? 'Deleting...' : 'Delete Tournament'}
                type="danger"
                marginbottom={BasePaddingsMargins.m10}
                onPress={handleDelete}
                disabled={loading || deleting}
              />

              <LFButton
                label="Cancel"
                type="outline-dark"
                onPress={() => F_isOpened(false)}
                disabled={loading || deleting}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
