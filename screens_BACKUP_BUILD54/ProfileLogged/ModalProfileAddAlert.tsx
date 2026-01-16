import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { useEffect, useState } from 'react';
import UIModalCloseButton from '../../components/UI/UIModal/UIModalCloseButton';
import LFInput from '../../components/LoginForms/LFInput';
import { EInputValidation } from '../../components/LoginForms/Interface';
import {
  GameTypes,
  IAlert,
  ItemsTableSizes,
  TournametFormats,
} from '../../hooks/InterfacesGlobal';
import RnRangeSlider from 'rn-range-slider';
import LFInputsRow from '../../components/LoginForms/LFInputsRow';
import LFCheckBox from '../../components/LoginForms/LFCheckBox';
import LFCheckboxesGroup from '../../components/LoginForms/LFCheckboxesGroup';
import LBButtonsGroup from '../../components/LoginForms/Button/LBButtonsGroup';
import LFInputDateRange from '../../components/LoginForms/LFInputDateRange_Fixed';
import {
  CreateAlert,
  GetAlertById,
  UpdateAlert,
} from '../../ApiSupabase/CrudAlerts';
// import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { useContextAuth } from '../../context/ContextAuth';
import ModalInfoMessage from '../../components/UI/UIModal/ModalInfoMessage';
import { BaseColors } from '../../hooks/Template';
// import { supabase } from "../../ApiSupabase/supabase";

export default function ModalProfileAddAlert({
  isOpened,
  F_isOpened,
  alertIdForEditing,
}: {
  isOpened: boolean;
  F_isOpened: (v: boolean) => void;
  alertIdForEditing: string;
}) {
  const { user } = useContextAuth();
  // const [isOpened, F_isOpened] = useState<boolean>(true);

  const [alertName, set_alertName] = useState<string>('');
  const [preferredGame, set_preferredGame] = useState<string>('');
  const [tableSize, set_tableSize] = useState<string>('');
  const [tournamentFormat, set_tournamentFormat] = useState<string>('');
  const [fargoRangeFrom, set_fargoRangeFrom] = useState<string>('');
  const [fargoRangeTo, set_fargoRangeTo] = useState<string>('');
  const [maxEntryFee, set_maxEntryFee] = useState<string>('');
  const [location, set_location] = useState<string>('');

  const [checked_reports_to_fargo, set_checked_reports_to_fargo] =
    useState<boolean>(false);
  const [checked_open_tournament, set_checked_open_tournament] =
    useState<boolean>(false);
  const [requiredFargoGames, set_requiredFargoGames] = useState<string>('0');

  // Date range state
  const [dateFrom, set_dateFrom] = useState<string>('');
  const [dateTo, set_dateTo] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  // const [info_message_visible, set_info_message_visible] = useState<boolean>(true);
  const [infoTitle, set_infoTitle] = useState<string>('');
  const [infoMessage, set_infoMessage] = useState<string>('');
  const [infoMessageId, set_infoMessageId] = useState<number>(0);

  const ___GetTheInputDetails = (): IAlert => {
    return {
      creator_id: user?.id,
      name: alertName,
      preffered_game: preferredGame,
      tournament_format: tournamentFormat,
      table_size: tableSize || undefined,
      fargo_range_from: Number(fargoRangeFrom) || 0,
      fargo_range_to: Number(fargoRangeTo) || 0,
      max_entry_fee: Number(maxEntryFee) || 0,
      location: location,
      reports_to_fargo: checked_reports_to_fargo,
      checked_open_tournament: checked_open_tournament,
      required_fargo_games:
        Number(requiredFargoGames) > 0 ? Number(requiredFargoGames) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    } as IAlert;
  };
  const ___CreateTheAlert = async () => {
    setLoading(true);
    // const {} = await supabase.
    const details = await CreateAlert(___GetTheInputDetails());
    // Alert.alert(details.error as string);
    setLoading(false);
    set_infoTitle('Alert Created!');
    set_infoMessage('Your new alert has been successfully created.');
    set_infoMessageId(new Date().valueOf());
    // closing the modal:
    F_isOpened(false);
  };
  const ___UpdateTheAlert = async () => {
    setLoading(true);
    const details = await UpdateAlert(
      alertIdForEditing,
      ___GetTheInputDetails(),
    );
    setLoading(false);
    set_infoTitle('Alert Updated!');
    set_infoMessage('Your alert has been successfully updated.');
    set_infoMessageId(new Date().valueOf());
    // closing the modal:
    F_isOpened(false);
  };

  const getTheAlert = async () => {
    const _alert: IAlert | null = await GetAlertById(alertIdForEditing);
    if (_alert !== null) {
      set_alertName(_alert.name);
      set_preferredGame(_alert.preffered_game);
      set_tableSize(_alert.table_size || '');
      set_tournamentFormat(_alert.tournament_format || '');
      set_fargoRangeFrom(_alert.fargo_range_from.toString());
      set_fargoRangeTo(_alert.fargo_range_to.toString());
      set_maxEntryFee(_alert.max_entry_fee.toString());
      set_location(_alert.location);
      set_checked_reports_to_fargo(_alert.reports_to_fargo);
      set_checked_open_tournament(_alert.checked_open_tournament);
      set_requiredFargoGames((_alert.required_fargo_games || 0).toString());

      // Set date range values
      set_dateFrom(_alert.date_from || '');
      set_dateTo(_alert.date_to || '');
    }
    // // // // // // // // // // console.log('_alert:', _alert)
  };

  useEffect(() => {
    if (alertIdForEditing !== '') getTheAlert();
  }, [alertIdForEditing]);

  return (
    <>
      <Modal animationType="fade" transparent={true} visible={isOpened}>
        <View style={[StyleModal.container]}>
          <TouchableOpacity
            style={[StyleModal.backgroundTouchableForClosing]}
            onPress={() => {
              F_isOpened(false);
            }}
          />

          <View style={[StyleModal.containerForScrollingView]}>
            <View
              style={[
                StyleModal.headingContainer,
                {
                  position: 'absolute',
                  top: 20,
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  backgroundColor: BaseColors.backgroundColor,
                  paddingTop: 25,
                  paddingBottom: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: BaseColors.secondary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text
                style={[StyleModal.heading, { textAlign: 'center', flex: 1 }]}
              >
                Create New Search Alert
              </Text>
              <View
                style={{
                  position: 'absolute',
                  right: 25,
                  top: '50%',
                  marginTop: -10,
                }}
              >
                <UIModalCloseButton F_isOpened={F_isOpened} />
              </View>
            </View>
            <ScrollView
              style={[
                StyleModal.scrollView,
                { marginTop: 100, marginBottom: 100 },
              ]}
            >
              <View style={[StyleModal.contentView, { paddingTop: 15 }]}>
                <View style={[StyleZ.loginFromContainer, { minHeight: 0 }]}>
                  <View style={StyleZ.loginForm}>
                    <LFInput
                      value={alertName}
                      keyboardType="default"
                      label="Alert Name"
                      placeholder="E.g., Local 9-Ball Tournaments"
                      defaultValue={alertName}
                      onChangeText={(text: string) => {
                        set_alertName(text);
                      }}
                      validations={[EInputValidation.Required]}
                    />

                    <LFInput
                      typeInput="dropdown"
                      value={preferredGame}
                      keyboardType="default"
                      label="Game Type"
                      placeholder="Select Game Type"
                      defaultValue={preferredGame}
                      onChangeText={(text: string) => {
                        set_preferredGame(text);
                      }}
                      validations={[EInputValidation.Required]}
                      items={GameTypes}
                    />

                    <LFInput
                      typeInput="dropdown"
                      value={tableSize}
                      keyboardType="default"
                      label="Table Size (Optional)"
                      placeholder="Select Table Size"
                      defaultValue={tableSize}
                      onChangeText={(text: string) => {
                        set_tableSize(text);
                      }}
                      validations={[]}
                      items={ItemsTableSizes}
                    />

                    <LFInput
                      typeInput="dropdown"
                      value={tournamentFormat}
                      keyboardType="default"
                      label="Tournament Format (Optional)"
                      placeholder="Select Tournament Format"
                      defaultValue={tournamentFormat}
                      onChangeText={(text: string) => {
                        set_tournamentFormat(text);
                      }}
                      validations={[]}
                      items={TournametFormats}
                    />

                    <LFInputsRow
                      label="Fargo Range (Optional)"
                      inputs={[
                        <LFInput
                          keyboardType="numeric"
                          placeholder="Min Fargo"
                          value={fargoRangeFrom}
                          defaultValue={fargoRangeFrom}
                          onChangeText={(text: string) => {
                            set_fargoRangeFrom(text);
                          }}
                          validations={[]}
                          label="Min Fargo"
                        />,
                        <LFInput
                          keyboardType="numeric"
                          placeholder="Max Fargo"
                          value={fargoRangeTo}
                          defaultValue={fargoRangeTo}
                          onChangeText={(text: string) => {
                            set_fargoRangeTo(text);
                          }}
                          validations={[]}
                          label="Max Fargo"
                        />,
                      ]}
                    />

                    <LFInput
                      keyboardType="numeric"
                      label="Max Entry Fee (Optional)"
                      placeholder="Add Max Entry Fee"
                      value={maxEntryFee}
                      defaultValue={maxEntryFee}
                      onChangeText={(text: string) => {
                        set_maxEntryFee(text);
                      }}
                      validations={[]}
                    />

                    <LFInput
                      keyboardType="default"
                      label="Location(Optional)"
                      placeholder="City Or Venue Name"
                      value={location}
                      defaultValue={location}
                      onChangeText={(text: string) => {
                        set_location(text);
                      }}
                      validations={[]}
                    />

                    <LFInput
                      keyboardType="numeric"
                      label="Required Fargo Games (Optional)"
                      placeholder="Minimum Number Of Fargo Games Required"
                      value={requiredFargoGames}
                      defaultValue={requiredFargoGames}
                      onChangeText={(text: string) => {
                        set_requiredFargoGames(text);
                      }}
                      validations={[]}
                    />

                    <LFInputDateRange
                      label="Tournament Date Range (Optional)"
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                      onDateFromChange={set_dateFrom}
                      onDateToChange={set_dateTo}
                      placeholder={{
                        from: 'From Date',
                        to: 'To Date',
                      }}
                    />

                    <LFCheckboxesGroup
                      checkboxes={[
                        <LFCheckBox
                          label="Reports To Fargo"
                          checked={checked_reports_to_fargo}
                          set_checked={set_checked_reports_to_fargo}
                        />,
                        <LFCheckBox
                          label="Open Tournament"
                          checked={checked_open_tournament}
                          set_checked={set_checked_open_tournament}
                        />,
                      ]}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: BaseColors.backgroundColor,
                padding: 15,
                paddingBottom: 20,
                borderTopWidth: 1,
                borderTopColor: BaseColors.secondary,
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <View style={{ flex: 0.48 }}>
                {alertIdForEditing === '' ? (
                  <LFButton
                    label="Create Alert"
                    icon="notifications"
                    type="primary"
                    loading={loading}
                    onPress={() => {
                      ___CreateTheAlert();
                    }}
                  />
                ) : (
                  <LFButton
                    label="Update Alert"
                    icon="notifications"
                    type="primary"
                    loading={loading}
                    onPress={() => {
                      ___UpdateTheAlert();
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 0.47 }}>
                <LFButton
                  label="Cancel"
                  type="secondary"
                  onPress={() => {
                    F_isOpened(false);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ModalInfoMessage
        message={infoMessage}
        title={infoTitle}
        id={infoMessageId}
      />
    </>
  );
}
