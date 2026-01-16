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
  const [fargoRatingFrom, set_fargoRatingFrom] = useState<number>(MIN_FARGO_RATING);
  const [fargoRatingTo, set_fargoRatingTo] = useState<number>(MAX_FARGO_RATING);

  const [minimun_required_fargo_games_10plus, set_minimun_required_fargo_games_10plus] = useState<boolean>(false);
  const [handicapped, set_handicapped] = useState<boolean>(false);
  const [reports_to_fargo, set_reports_to_fargo] = useState<boolean>(false);
  const [is_open_tournament, set_is_open_tournament] = useState<boolean>(false);

  const [table_size, set_table_size] = useState<string>('');
  const [filters_are_applied, set_filters_are_applied] = useState<boolean>(false);

  const ___ApplyFilters = () => {
    console.log('=== APPLYING FILTERS IN MODAL ===');
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
        handicapped: handicapped,
        is_open_tournament: is_open_tournament,
        minimun_required_fargo_games_10plus: minimun_required_fargo_games_10plus,
        reports_to_fargo: reports_to_fargo,
        filtersFromModalAreAplied: true,
        format: format,
      },
    } as ITournamentFilters;

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
    set_minimun_required_fargo_games_10plus(false);
    set_handicapped(false);
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
        handicapped: false,
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
      if (filtersOut.game_type !== undefined) set_gameType(filtersOut.game_type);
      if (filtersOut.format !== undefined) set_format(filtersOut.format);
      if (filtersOut.equipment !== undefined) set_equipment(filtersOut.equipment);
      if (filtersOut.table_size !== undefined) set_table_size(filtersOut.table_size);
      if (filtersOut.equipment_custom !== undefined) set_custom_equipment(filtersOut.equipment_custom);
      if (filtersOut.daysOfWeek !== undefined) set_daysOfWeek(filtersOut.daysOfWeek);
      if (filtersOut.entryFeeFrom !== undefined) set_entryFeeFrom(filtersOut.entryFeeFrom);
      if (filtersOut.entryFeeTo !== undefined) set_entryFeeTo(filtersOut.entryFeeTo);
      if (filtersOut.fargoRatingFrom !== undefined) set_fargoRatingFrom(filtersOut.fargoRatingFrom);
      if (filtersOut.fargoRatingTo !== undefined) set_fargoRatingTo(filtersOut.fargoRatingTo);

      set_minimun_required_fargo_games_10plus(filtersOut.minimun_required_fargo_games_10plus === true);
      set_handicapped(filtersOut.handicapped === true);
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

        <View style={[StyleModal.containerForScrollingView]}>
          {/* Fixed Header */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            zIndex: 1000,
            backgroundColor: BaseColors.dark,
            paddingHorizontal: BasePaddingsMargins.m20,
            paddingTop: BasePaddingsMargins.m15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: BaseColors.PanelBorderColor,
          }}>
            <Text style={[StyleZ.h2, { marginBottom: 0 }]}>Filters</Text>
            <UIModalCloseButton F_isOpened={F_isOpened} />
          </View>

          {/* Scrollable Content with Top and Bottom Padding */}
          <ScrollView 
            style={[StyleModal.scrollView]}
            contentContainerStyle={{
              paddingTop: 80, // Space for fixed header
              paddingBottom: 120, // Space for fixed footer
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
              label="*Tournament
