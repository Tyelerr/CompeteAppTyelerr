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
  // Filter state
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
  const [dateFrom, set_dateFrom] = useState<string>('');
  const [dateTo, set_dateTo] = useState<string>('');
  const [filters_are_applied, set_filters_are_applied] =
    useState<boolean>(false);

  // Apply filters function
  const ___ApplyFilters = () => {
    console.log('🎯 ===== APPLYING FILTERS (BUILD 161) =====');
    console.log('📋 Filter Values Being Applied:');
    console.log('   game_type:', `"${game_type}"`);
    console.log('   format:', `"${format}"`);
    console.log('   table_size:', `"${table_size}"`);
    console.log('   equipment:', `"${equipment}"`);
    console.log('   custom_equipment:', `"${custom_equipment}"`);
    console.log('   daysOfWeek:', daysOfWeek);
    console.log('   dateFrom:', `"${dateFrom}"`, 'dateTo:', `"${dateTo}"`);
    console.log('   entryFeeFrom:', entryFeeFrom, 'entryFeeTo:', entryFeeTo);
    console.log(
      '   fargoRatingFrom:',
      fargoRatingFrom,
      'fargoRatingTo:',
      fargoRatingTo,
    );
    console.log('   is_open_tournament:', is_open_tournament);
    console.log(
      '   minimun_required_fargo_games_10plus:',
      minimun_required_fargo_games_10plus,
    );
    console.log('   reports_to_fargo:', reports_to_fargo);

    // Create new filter object - CRITICAL: Only include non-empty values
    // BUILD 163 FIX: Don't spread filtersOut - it preserves old filter values
    // Only preserve location filters (zip_code, city, state, radius, userRole)
    const newFilters: ITournamentFilters = {
      // Preserve ONLY location filters from parent
      zip_code: filtersOut.zip_code,
      city: filtersOut.city,
      state: filtersOut.state,
      radius: filtersOut.radius,
      userRole: filtersOut.userRole,

      // Apply modal filters - only if they have values
      ...(game_type &&
        game_type.trim() !== '' && { game_type: game_type.trim() }),
      ...(format && format.trim() !== '' && { format: format.trim() }),
      ...(table_size &&
        table_size.trim() !== '' && { table_size: table_size.trim() }),
      ...(equipment &&
        equipment.trim() !== '' && { equipment: equipment.trim() }),
      ...(custom_equipment &&
        custom_equipment.trim() !== '' && {
          equipment_custom: custom_equipment.trim(),
        }),

      // FIXED BUILD 164: Days of week filter - use correct property name
      ...(daysOfWeek && daysOfWeek.length > 0 && { daysOfWeek: daysOfWeek }),

      // FIXED BUILD 164: Date range persistence - always include if set
      ...(dateFrom && dateFrom.trim() !== '' && { dateFrom: dateFrom.trim() }),
      ...(dateTo && dateTo.trim() !== '' && { dateTo: dateTo.trim() }),

      // Always include range filters (even if at default values)
      entryFeeFrom,
      entryFeeTo,
      fargoRatingFrom,
      fargoRatingTo,

      // FIXED BUILD 163: Only include boolean filters when they are TRUE
      // Don't send false values - let the database show all tournaments for that filter
      ...(is_open_tournament === true && { is_open_tournament: true }),
      ...(minimun_required_fargo_games_10plus === true && {
        minimun_required_fargo_games_10plus: true,
      }),
      ...(reports_to_fargo === true && { reports_to_fargo: true }),

      // Mark that filters were applied from modal
      filtersFromModalAreAplied: true,
    };

    console.log(
      '✅ Final filter object to send:',
      JSON.stringify(newFilters, null, 2),
    );
    console.log('🎯 ===== END APPLYING FILTERS =====');

    set_FiltersOut(newFilters);
    F_isOpened(false);
  };

  // Reset filters function
  const ___ResetFilters = () => {
    console.log('🔄 RESETTING ALL FILTERS');

    // Reset local state
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

    // Send reset filters to parent - preserve only location filters
    const resetFilters: ITournamentFilters = {
      zip_code: filtersOut.zip_code,
      city: filtersOut.city,
      state: filtersOut.state,
      radius: filtersOut.radius,
      userRole: filtersOut.userRole,
      filtersFromModalAreAplied: false,
    };

    console.log(
      '✅ Reset filters sent to parent:',
      JSON.stringify(resetFilters, null, 2),
    );
    set_FiltersOut(resetFilters);
    F_isOpened(false);
  };

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpened) {
      console.log(
        '📂 MODAL OPENED - Initializing with filters:',
        JSON.stringify(filtersOut, null, 2),
      );

      // Initialize from filtersOut
      set_gameType(filtersOut.game_type || '');
      set_format(filtersOut.format || '');
      set_equipment(filtersOut.equipment || '');
      set_table_size(filtersOut.table_size || '');
      set_custom_equipment(filtersOut.equipment_custom || '');
      set_daysOfWeek(filtersOut.daysOfWeek || []);
      set_entryFeeFrom(filtersOut.entryFeeFrom ?? MIN_ENTRY_FEE);
      set_entryFeeTo(filtersOut.entryFeeTo ?? MAX_ENTRY_FEE);
      set_fargoRatingFrom(filtersOut.fargoRatingFrom ?? MIN_FARGO_RATING);
      set_fargoRatingTo(filtersOut.fargoRatingTo ?? MAX_FARGO_RATING);
      set_dateFrom(filtersOut.dateFrom || '');
      set_dateTo(filtersOut.dateTo || '');
      set_minimun_required_fargo_games_10plus(
        filtersOut.minimun_required_fargo_games_10plus === true,
      );
      set_reports_to_fargo(filtersOut.reports_to_fargo === true);
      set_is_open_tournament(filtersOut.is_open_tournament === true);
      set_filters_are_applied(filtersOut.filtersFromModalAreAplied === true);
    }
  }, [isOpened]);

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
              onChangeText={(value: string) => {
                console.log('🎮 Game Type changed to:', `"${value}"`);
                set_gameType(value);
              }}
              placeholder="All Game Types"
              items={GameTypes}
            />

            <LFInput
              marginBottomInit={BasePaddingsMargins.formInputMarginLess}
              typeInput="dropdown"
              keyboardType="default"
              label="Tournament Format"
              placeholder="Select The Format"
              defaultValue={format}
              value={format}
              onChangeText={(value: string) => {
                console.log('📋 Format changed to:', `"${value}"`);
                set_format(value);
              }}
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
              onChangeText={(value: string) => {
                console.log('📏 Table Size changed to:', `"${value}"`);
                set_table_size(value);
              }}
            />

            <LFInputEquipment
              equipment={equipment}
              set_equipment={(value: string) => {
                console.log('🎱 Equipment changed to:', `"${value}"`);
                set_equipment(value);
              }}
              custom_equipment={custom_equipment}
              set_custom_equipment={(value: string) => {
                console.log('🎱 Custom Equipment changed to:', `"${value}"`);
                set_custom_equipment(value);
              }}
              validations={[]}
            />

            <LFDaysOfTheWeek
              set_selectedDaysOut={(days: number[]) => {
                console.log('📅 Days of Week changed to:', days);
                set_daysOfWeek(days);
              }}
              selectedDaysOut={daysOfWeek}
            />

            <LFInputDateRange
              label="Tournament Date Range"
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(value: string) => {
                console.log('📆 Date From changed to:', `"${value}"`);
                set_dateFrom(value);
              }}
              onDateToChange={(value: string) => {
                console.log('📆 Date To changed to:', `"${value}"`);
                set_dateTo(value);
              }}
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
                console.log('💰 Entry Fee Range changed to:', vl, '-', vr);
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
                console.log('⭐ Fargo Rating Range changed to:', vl, '-', vr);
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
                  set_checked={(value: boolean) => {
                    console.log(
                      '✅ Minimum Required Fargo Games changed to:',
                      value,
                    );
                    set_minimun_required_fargo_games_10plus(value);
                  }}
                />,
                <LFCheckBox
                  key="reports-fargo"
                  label="Reports to Fargo"
                  checked={reports_to_fargo}
                  set_checked={(value: boolean) => {
                    console.log('✅ Reports to Fargo changed to:', value);
                    set_reports_to_fargo(value);
                  }}
                />,
                <LFCheckBox
                  key="open-tournament"
                  label="Open Tournament"
                  checked={is_open_tournament}
                  set_checked={(value: boolean) => {
                    console.log('✅ Open Tournament changed to:', value);
                    set_is_open_tournament(value);
                  }}
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
