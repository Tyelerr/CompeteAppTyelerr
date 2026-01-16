import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import UIModalCloseButton from '../../components/UI/UIModal/UIModalCloseButton';
import LFInput from '../../components/LoginForms/LFInput';
import {
  GameTypes,
  ItemsTableSizes,
  ITournamentFilters,
  TournametFormats,
} from '../../hooks/InterfacesGlobal';
import { useEffect, useState } from 'react';
import LFInputEquipment from '../../components/LoginForms/LFInputEquipment';
import LFDaysOfTheWeek from '../../components/LoginForms/LFDaysOfTheWeek';
import ZSlider from '../../components/UI/ZSlider/ZSlider';
import ZSliderRange from '../../components/UI/ZSlider/ZSliderRange';
import LFCheckboxesGroup from '../../components/LoginForms/LFCheckboxesGroup';
import LFCheckBox from '../../components/LoginForms/LFCheckBox';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LFInputDateRange from '../../components/LoginForms/LFInputDateRange_Fixed';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';

const MIN_ENTRY_FEE: number = 0;
const MAX_ENTRY_FEE: number = 1000;
const MIN_FARGO_RATING: number = 0;
const MAX_FARGO_RATING: number = 900;

export default function ScreenBilliardModalFilters({
  isOpened,
  F_isOpened,
  set_FiltersOut,
  filtersOut,
  userProfile,
}: {
  isOpened: boolean;
  F_isOpened: (b: boolean) => void;
  set_FiltersOut: (ft: ITournamentFilters) => void;
  filtersOut: ITournamentFilters;
  userProfile?: { zip_code?: string };
}) {
  const [game_type, set_gameType] = useState<string>('');
  const [format, set_format] = useState<string>('');
  const [equipment, set_equipment] = useState<string>('');
  const [custom_equipment, set_custom_equipment] = useState<string>('');
  const [daysOfWeek, set_daysOfWeek] = useState<number[]>([]);
  const [entryFeeFrom, set_entryFeeFrom] = useState<number>(MIN_ENTRY_FEE);
  const [entryFeeTo, set_entryFeeTo] = useState<number>(MAX_ENTRY_FEE);
  const [fargoRatingFrom, set_fargoRatingFrom] =
    useState<number>(MIN_FARGO_RATING);
  const [fargoRatingTo, set_fargoRatingTo] = useState<number>(MAX_FARGO_RATING);

  const [
    minimun_required_fargo_games_10plus,
    set_minimun_required_fargo_games_10plus,
  ] = useState<boolean>(false);
  const [reports_to_fargo, set_reports_to_fargo] = useState<boolean>(false);
  const [is_open_tournament, set_is_open_tournament] = useState<boolean>(false);

  const [table_size, set_table_size] = useState<string>('');

  // Date range state
  const [dateFrom, set_dateFrom] = useState<string>('');
  const [dateTo, set_dateTo] = useState<string>('');

  const [filters_are_applied, set_filters_are_applied] =
    useState<boolean>(false);

  const ___ApplyFilters = () => {
    console.log('=== APPLYING FILTERS IN MODAL ===');
    console.log('Current filter values:');
    console.log('  game_type:', game_type);
    console.log('  format:', format);
    console.log('  equipment:', equipment);
    console.log('  custom_equipment:', custom_equipment);
    console.log('  table_size:', table_size);
    console.log('  daysOfWeek:', daysOfWeek);
    console.log('  entryFeeFrom:', entryFeeFrom, 'entryFeeTo:', entryFeeTo);
    console.log(
      '  fargoRatingFrom:',
      fargoRatingFrom,
      'fargoRatingTo:',
      fargoRatingTo,
    );
    console.log('  is_open_tournament:', is_open_tournament);
    console.log(
      '  minimun_required_fargo_games_10plus:',
      minimun_required_fargo_games_10plus,
    );
    console.log('  reports_to_fargo:', reports_to_fargo);
    console.log('  dateFrom:', dateFrom, 'dateTo:', dateTo);

    const filtersToApply = {
      ...JSON.parse(JSON.stringify(filtersOut)),
      ...{
        equipment: equipment,
        equipment_custom: custom_equipment,
        game_type: game_type,
        table_size: table_size,
        daysOfWeek: daysOfWeek,
        entryFeeFrom: entryFeeFrom,
        entryFeeTo: entryFeeTo,
        fargoRatingFrom: fargoRatingFrom,
        fargoRatingTo: fargoRatingTo,
        is_open_tournament: is_open_tournament,
        minimun_required_fargo_games_10plus:
          minimun_required_fargo_games_10plus,
        reports_to_fargo: reports_to_fargo,
        filtersFromModalAreAplied: true,
        format: format,
        dateFrom: dateFrom,
        dateTo: dateTo,
      },
    } as ITournamentFilters;

    console.log(
      'Final filters object being sent to parent:',
      JSON.stringify(filtersToApply, null, 2),
    );
    set_FiltersOut(filtersToApply);
    F_isOpened(false);
  };

  const ___ResetFilters = () => {
    set_gameType('');
    set_format('');
    set_equipment('');
    set_custom_equipment('');
    set_daysOfWeek([]);
    set_entryFeeFrom(MIN_ENTRY_FEE);
    set_entryFeeTo(MAX_ENTRY_FEE);
    set_fargoRatingFrom(MIN_FARGO_RATING);
    set_fargoRatingTo(MAX_FARGO_RATING);
    set_dateFrom('');
    set_dateTo('');
    set_minimun_required_fargo_games_10plus(false);
    set_reports_to_fargo(false);
    set_is_open_tournament(false);
    set_table_size('');
    set_filters_are_applied(false);

    set_FiltersOut({
      ...JSON.parse(JSON.stringify(filtersOut)),
      ...{
        equipment: '',
        equipment_custom: '',
        game_type: '',
        table_size: '',
        format: '',
        daysOfWeek: [],
        entryFeeFrom: MIN_ENTRY_FEE,
        entryFeeTo: MAX_ENTRY_FEE,
        fargoRatingFrom: MIN_FARGO_RATING,
        fargoRatingTo: MAX_FARGO_RATING,
        dateFrom: '',
        dateTo: '',
        is_open_tournament: false,
        minimun_required_fargo_games_10plus: false,
        reports_to_fargo: false,
        filtersFromModalAreAplied: false,
      },
    } as ITournamentFilters);

    F_isOpened(false);
  };

  useEffect(() => {
    if (isOpened) {
      if (filtersOut.game_type !== undefined)
        set_gameType(filtersOut.game_type);
      if (filtersOut.format !== undefined) set_format(filtersOut.format);
      if (filtersOut.equipment !== undefined)
        set_equipment(filtersOut.equipment);
      if (filtersOut.table_size !== undefined)
        set_table_size(filtersOut.table_size);
      if (filtersOut.equipment_custom !== undefined)
        set_custom_equipment(filtersOut.equipment_custom);
      if (filtersOut.daysOfWeek !== undefined)
        set_daysOfWeek(filtersOut.daysOfWeek);
      if (filtersOut.entryFeeFrom !== undefined)
        set_entryFeeFrom(filtersOut.entryFeeFrom);
      if (filtersOut.entryFeeTo !== undefined)
        set_entryFeeTo(filtersOut.entryFeeTo);
      if (filtersOut.fargoRatingFrom !== undefined)
        set_fargoRatingFrom(filtersOut.fargoRatingFrom);
      if (filtersOut.fargoRatingTo !== undefined)
        set_fargoRatingTo(filtersOut.fargoRatingTo);

      // Initialize date range
      if (filtersOut.dateFrom !== undefined) set_dateFrom(filtersOut.dateFrom);
      if (filtersOut.dateTo !== undefined) set_dateTo(filtersOut.dateTo);

      set_minimun_required_fargo_games_10plus(
        filtersOut.minimun_required_fargo_games_10plus === true,
      );
      set_reports_to_fargo(filtersOut.reports_to_fargo === true);
      set_is_open_tournament(filtersOut.is_open_tournament === true);
      set_filters_are_applied(filtersOut.filtersFromModalAreAplied === true);
    }
  }, [isOpened, filtersOut]);

  return (
    <Modal animationType="fade" transparent={true} visible={isOpened}>
      <View style={[StyleModal.container]}>
        <TouchableOpacity
          style={[StyleModal.backgroundTouchableForClosing]}
          onPress={() => F_isOpened(false)}
        />

        <View style={[StyleModal.containerForScrollingView, { height: '85%' }]}>
          {/* Header with Close Button - Fixed Position */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 70,
              backgroundColor: BaseColors.dark,
              zIndex: 1000,
              paddingHorizontal: BasePaddingsMargins.m20,
              paddingTop: BasePaddingsMargins.m20,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: BaseColors.PanelBorderColor,
            }}
          >
            {/* Close Button - Positioned on the right */}
            <View
              style={{
                position: 'absolute',
                right: BasePaddingsMargins.m20,
                top: BasePaddingsMargins.m20,
              }}
            >
              <UIModalCloseButton F_isOpened={F_isOpened} />
            </View>

            {/* Centered Title */}
            <Text style={[StyleZ.h2, { marginBottom: 0, textAlign: 'center' }]}>
              Tournament Filters
            </Text>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={[StyleModal.scrollView]}
            contentContainerStyle={{
              paddingTop: 90, // Space for header
              paddingBottom: 120, // Space for footer
              paddingHorizontal: BasePaddingsMargins.m20,
            }}
            showsVerticalScrollIndicator={true}
          >
            <LFInput
              typeInput="dropdown"
              defaultValue={game_type}
              value={game_type}
              marginBottomInit={BasePaddingsMargins.formInputMarginLess}
              label="Game Type"
              onChangeText={set_gameType}
              placeholder="All Game Types"
              items={GameTypes}
            />

            <LFInput
              marginBottomInit={BasePaddingsMargins.formInputMarginLess}
              typeInput="dropdown"
              keyboardType="default"
              label="*Tournament Format"
              placeholder="Select The Format"
              defaultValue={format}
              value={format}
              onChangeText={set_format}
              items={TournametFormats}
            />

            <LFInput
              typeInput="dropdown"
              marginBottomInit={BasePaddingsMargins.formInputMarginLess}
              label="Table Size"
              placeholder="Table Size"
              value={table_size}
              defaultValue={table_size}
              items={ItemsTableSizes}
              validations={[]}
              onChangeText={(text: string) => {
                set_table_size(text);
              }}
            />

            <LFInputEquipment
              equipment={equipment}
              set_equipment={set_equipment}
              custom_equipment={custom_equipment}
              set_custom_equipment={set_custom_equipment}
              validations={[]}
            />

            <LFDaysOfTheWeek
              set_selectedDaysOut={set_daysOfWeek}
              selectedDaysOut={daysOfWeek}
            />

            <LFInputDateRange
              label="Tournament Date Range"
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={set_dateFrom}
              onDateToChange={set_dateTo}
              marginBottomInit={BasePaddingsMargins.formInputMarginLess}
              placeholder={{
                from: 'From Date',
                to: 'To Date',
              }}
            />

            <ZSlider
              type="range"
              min={MIN_ENTRY_FEE}
              max={MAX_ENTRY_FEE}
              label="Entry Fee Range"
              measurementTemplates={['${v}', '${v}+']}
              templateValuesMinMax="${vl} — ${vr}"
              step={1}
              valueLeft={entryFeeFrom}
              valueRight={entryFeeTo}
              onValueChangeRange={(vl: number, vr: number) => {
                set_entryFeeFrom(vl);
                set_entryFeeTo(vr);
              }}
            />

            <ZSlider
              type="range"
              min={MIN_FARGO_RATING}
              max={MAX_FARGO_RATING}
              valueLeft={fargoRatingFrom}
              valueRight={fargoRatingTo}
              label="Fargo Rating Range"
              measurementTemplates={['{v}', '{v}+']}
              templateValuesMinMax="{vl} — {vr}"
              step={1}
              onValueChangeRange={(vl: number, vr: number) => {
                set_fargoRatingFrom(vl);
                set_fargoRatingTo(vr);
              }}
            />

            <LFCheckboxesGroup
              checkboxes={[
                <LFCheckBox
                  key="fargo-games"
                  label="Minimum Required Fargo Games"
                  checked={minimun_required_fargo_games_10plus}
                  set_checked={set_minimun_required_fargo_games_10plus}
                />,
                <LFCheckBox
                  key="reports-fargo"
                  label="Reports to Fargo"
                  checked={reports_to_fargo}
                  set_checked={set_reports_to_fargo}
                />,
                <LFCheckBox
                  key="open-tournament"
                  label="Open Tournament"
                  checked={is_open_tournament}
                  set_checked={set_is_open_tournament}
                />,
              ]}
            />
          </ScrollView>

          {/* Footer with Buttons - Fixed Position */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
              backgroundColor: BaseColors.dark,
              zIndex: 1000,
              paddingHorizontal: BasePaddingsMargins.m20,
              paddingTop: BasePaddingsMargins.m15,
              paddingBottom: BasePaddingsMargins.m20,
              borderTopWidth: 1,
              borderTopColor: BaseColors.PanelBorderColor,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ width: '48%' }}>
                <LFButton
                  label="Apply Filters"
                  type="success"
                  onPress={___ApplyFilters}
                />
              </View>
              <View style={{ width: '48%' }}>
                <LFButton
                  label="Reset All"
                  type={filters_are_applied === true ? 'primary' : 'secondary'}
                  onPress={___ResetFilters}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
