import { Alert, Platform, Text, View } from 'react-native';
import ScreenScrollView from '../ScreenScrollView';
import UIPanel from '../../components/UI/UIPanel';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { StyleZ } from '../../assets/css/styles';
import LFInput from '../../components/LoginForms/LFInput';
import {
  EInputValidation,
  IPickerOption,
} from '../../components/LoginForms/Interface';
import {
  EIGameTypes,
  ETournamentStatuses,
  GameTypes,
  ICAUserData,
  ItemsTableSizes,
  ITournament,
  IVenue,
  TimeItems,
  TournametFormats,
  EUserRole,
} from '../../hooks/InterfacesGlobal';
import UICalendar, {
  convertLocalJsDateToMysql,
} from '../../components/UI/UIDateTime/UICalendar';
import { getCurrentTimezone } from '../../hooks/hooks';
import LFCheckBox from '../../components/LoginForms/LFCheckBox';
import LFInputsGrid, {
  ILFInputGridInput,
} from '../../components/LoginForms/LFInputsGrid';
import DirectPlaceSearch from '../../components/google/GoogleSearchVenue';
import { useEffect, useState } from 'react';
import ThumbnailSelector from '../../components/ThumbnailSelector/ThumbnailSelector';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { IFormInputValidation, TheFormIsValid } from '../../hooks/Validations';
import { useContextAuth } from '../../context/ContextAuth';
import {
  CreateTournament,
  FetchTheTournamentsForLoggedUser,
  GetPhoneNumbersFromTournamentsByVenue,
} from '../../ApiSupabase/CrudTournament';
import ModalInfoMessage from '../../components/UI/UIModal/ModalInfoMessage';
import { useNavigation } from '@react-navigation/native';
import LFInputEquipment from '../../components/LoginForms/LFInputEquipment';
import { Filter } from 'bad-words';
import VenuesEditor from '../../components/google/VenuesEditor/VenuesEditor';
import LFDropdownVenues from '../../components/LoginForms/LFDropdownVenues';
import LFDropdownTournamentDirectorVenues from '../../components/LoginForms/LFDropdownTournamentDirectorVenues';
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
// import { DateTimePickerAndroidPicker } from "@react-native-community/datetimepicker";

const filter: Filter = new Filter();

// Role label mapping
const getRoleLabel = (role?: EUserRole): string => {
  switch (role) {
    case EUserRole.BasicUser:
      return 'Basic User';
    case EUserRole.CompeteAdmin:
      return 'Compete Admin';
    case EUserRole.BarAdmin:
      return 'Bar Owner';
    case EUserRole.TournamentDirector:
      return 'Tournament Director';
    case EUserRole.MasterAdministrator:
      return 'Master Admin';
    default:
      return 'User';
  }
};

export default function ScreenSubmit() {
  const { user } = useContextAuth();

  const [tournamentName, set_tournamentName] = useState<string>('');
  const [gameType, set_gameType] = useState<string>('');
  const [tournamentFormat, set_tournamentFormat] = useState<string>('');
  const [tournamentDirectorName, set_tournamentDirectorName] =
    useState<string>('');
  const [description, set_description] = useState<string>('');
  const [equipment, set_equipment] = useState<string>('');
  const [custom_equipment, set_custom_equipment] = useState<string>('');
  const [gameSpot, set_gameSpot] = useState<string>('');
  const [date, set_date] = useState<string>(
    convertLocalJsDateToMysql(new Date()),
  );
  const [time, set_time] = useState<string>('');
  const [reportsToFargo, set_reportsToFargo] = useState<boolean>(false);
  const [isOpenTournament, set_isOpenTournament] = useState<boolean>(false);
  const [recurringTournament, set_recurringTournament] =
    useState<boolean>(false);
  const [race, set_race] = useState<string>('');
  const [tableSize, set_tableSize] = useState<string>('');
  const [numberOfTables, set_numberOfTables] = useState<string>('');
  const [maximumFargo, set_maximumFargo] = useState<string>('');
  const [requiredFargoGames, set_requiredFargoGames] = useState<string>('');
  const [tournamentFee, set_tournamentFee] = useState<string>('');
  const [sidePots, set_sidePots] = useState<ILFInputGridInput[][]>([]);

  // the details for the venues are adding into the tournaments table too
  // please don't delete those states they are used for the searching
  const [venue, set_venue] = useState<string>('');
  const [venueLat, set_venueLat] = useState<string>('');
  const [venueLng, set_venueLng] = useState<string>('');
  const [venueAddress, set_venueAddress] = useState<string>('');

  const [phone_number, set_phone_number] = useState<string>('');
  const [venueId, setVenueId] = useState<number>(-1);
  const [tournametn_thumbnail_type, set_tournametn_thumbnail_type] =
    useState<string>(EIGameTypes.Ball8);
  const [tournametn_thumbnail_url, set_tournametn_thumbnail_url] =
    useState<string>('');

  const [loading, set_loading] = useState<boolean>(false);
  const [formErrorMessage, set_formErrorMessage] = useState<string>('');

  const [successModalVisible, set_successModalVisible] =
    useState<boolean>(false);

  // Tournament Director venue selection states
  const [selectedTDVenue, setSelectedTDVenue] = useState<IVenue | null>(null);
  const [selectedTDTableSize, setSelectedTDTableSize] = useState<string>('');
  const [selectedTDTableBrand, setSelectedTDTableBrand] = useState<string>('');
  const [selectedTDTableCount, setSelectedTDTableCount] = useState<number>(0);
  const [availableTDTableCount, setAvailableTDTableCount] = useState<number>(0);

  // User role detection
  const isTournamentDirector = user?.role === EUserRole.TournamentDirector;

  // Mutual exclusivity between Maximum Fargo and Open Tournament
  const hasMaximumFargo = maximumFargo !== '' && Number(maximumFargo) > 0;
  const isOpenTournamentDisabled = hasMaximumFargo;
  const isMaximumFargoDisabled = isOpenTournament;

  const __selectVenue = (venue: IVenue) => {
    setVenueId(venue.id);
    set_venue(venue.venue);
    set_venueLat(venue.venue_lat);
    set_venueLng(venue.venue_lng);
    set_venueAddress(venue.address);
    set_phone_number(venue.phone);
  };

  /**
   * statusRecurringTournament will check if the combinations are good so it will work good and will not show error message
   */
  const [statusRecurringTournament, set_statusRecurringTournament] = useState<
    'no-recurring' | 'recurring-valid' | 'recurring-error'
  >('no-recurring');

  // validations
  // const [tounamentNameIsValid, set_tounamentNameIsValid] = useState<boolean>(true);
  const [pingValidation, set_pingValidation] = useState<boolean>(false);

  const navigation = useNavigation();

  const [old_tournaments, set_old_tournaments] = useState<ITournament[]>([]);
  const [items_past_tournaments, set_items_past_tournaments] = useState<
    IPickerOption[]
  >([]);
  const [old_tournamentByKey, set_old_tournamentByKey] =
    useState<ITournament | null>(null);
  const ___LoadPastTournaments = async () => {
    const { data, error } = await FetchTheTournamentsForLoggedUser(
      user as ICAUserData,
    );
    const pastTournamentsItems: IPickerOption[] = [];
    if (data) {
      // have past tournaments
      data.map((obj: ITournament, key: number) => {
        pastTournamentsItems.push({
          label: `${obj.tournament_name}, ID:${obj.id_unique_number}`,
          value: key,
        });
      });
      set_old_tournaments(data as ITournament[]);
      set_items_past_tournaments(pastTournamentsItems);
    } else {
      // no past tournaments
    }
  };
  useEffect(() => {
    ___LoadPastTournaments();
  }, []);

  const _validationsArray: IFormInputValidation[] = [
    { value: tournamentName, validations: [EInputValidation.Required] },
    { value: gameType, validations: [EInputValidation.Required] },
    { value: tournamentFormat, validations: [EInputValidation.Required] },
    // {value: tournamentDirectorName, validations: [EInputValidation.Required]},
    { value: description, validations: [EInputValidation.Required] },
    // {value: equipment, validations: [EInputValidation.Required]},
    { value: gameSpot, validations: [EInputValidation.Required] },
    { value: date, validations: [EInputValidation.Required] },
    { value: time, validations: [EInputValidation.Required] },
    { value: race, validations: [EInputValidation.Required] },
    {
      value: numberOfTables,
      validations: [EInputValidation.Required, EInputValidation.GreatThenZero],
    },
    // {value: tournamentFee, validations: [EInputValidation.Required]},
    // {value: venueAddress, validations: [EInputValidation.Required]},
    { value: phone_number, validations: [EInputValidation.Required] },
  ];
  const __SubmitTheTournament = async () => {
    set_loading(true);
    // Alert.alert('1');
    // set_loading(true);
    set_formErrorMessage('');
    if (statusRecurringTournament === 'recurring-error') {
      set_formErrorMessage(
        '⚠️ Please select both date and time for the recurring tournament.',
      );
      set_loading(false);
      return;
    }
    // pinging the validation will see if the input is valid and will show the error messages if the input is not valid
    set_pingValidation(!pingValidation);
    // set_pingGameTypeValidation( !pingGameTypeValidation );
    /////// pinging errors end
    /////////////////////////////////////////////////////
    if (!TheFormIsValid(_validationsArray)) {
      set_formErrorMessage(
        'Required fields are missing. Please complete them.',
      );
      set_loading(false);
      return;
    }

    const arrayValuesCheckForBadWords: string[] = [
      tournamentName,
      tournamentDirectorName,
      description,
      custom_equipment,
    ];
    for (let i = 0; i < arrayValuesCheckForBadWords.length; i++) {
      if (filter.isProfane(arrayValuesCheckForBadWords[i])) {
        set_formErrorMessage('Warning: Bad word detected!');
        set_loading(false);
        return;
      }
    }

    // return;

    const newTournament: ITournament = {
      uuid: user !== null ? (user.id as string) : '',
      tournament_name: tournamentName,
      address: venueAddress,
      // created_at:
      description: description,
      director_name: tournamentDirectorName,
      equipment: equipment,
      custom_equipment: custom_equipment,
      format: tournamentFormat,
      game_spot: gameSpot,
      game_type: gameType,
      is_open_tournament: isOpenTournament,
      is_recurring: recurringTournament,
      max_fargo: Number(maximumFargo),
      table_size: tableSize,
      number_of_tables: Number(numberOfTables),
      phone: phone_number,
      race_details: race,
      reports_to_fargo: reportsToFargo,
      side_pots: sidePots,
      thumbnail_url: tournametn_thumbnail_url,
      thumbnail_type: tournametn_thumbnail_type,
      venue: venue,
      venue_lat: venueLat,
      venue_lng: venueLng,
      tournament_fee: Number(tournamentFee),
      start_date: date,
      strart_time: time,
      venue_id: venueId,
    } as ITournament;

    const { data, error } = await CreateTournament(newTournament);
    // // // // // // // // // // console.log('After creating the tournament data: ', {data, error});
    set_loading(false);

    set_successModalVisible(true);
  };

  const ___LoadThePhoneNumberForVenue = async () => {
    const { data, error } = await GetPhoneNumbersFromTournamentsByVenue(venue);
    // if(error== =null)
    // // // // // console.log('data:', data);
    if (data !== null && data.length === 1) {
      const tournamentThatHavePhone: ITournament = data[0] as ITournament;
      set_phone_number(tournamentThatHavePhone.phone);
    }
  };

  useEffect(() => {
    // // // // // console.log('Now Here load the phone numbers');
    ___LoadThePhoneNumberForVenue();
  }, [venue]);

  useEffect(() => {
    set_formErrorMessage('');
    if (recurringTournament !== true) {
      set_statusRecurringTournament('no-recurring');
    } else {
      if (date === '' || time === '') {
        // this is the case when the form should not submit
        set_statusRecurringTournament('recurring-error');
      } else {
        set_statusRecurringTournament('recurring-valid');
      }
    }
  }, [recurringTournament, date, time]);

  useEffect(() => {
    set_tournamentDirectorName(
      (user?.user_name !== '' && user?.user_name !== undefined
        ? user.user_name
        : user?.email) as string,
    );
  }, [user]);

  return (
    <>
      <ScreenScrollView>
        <View
          style={[
            {
              paddingTop: BasePaddingsMargins.m20,
            },
          ]}
        >
          <Text
            style={{
              fontSize: TextsSizes.h2,
              fontWeight: 'bold',
              textAlign: 'center',
              color: BaseColors.light,
              width: '100%',
              marginBottom: BasePaddingsMargins.m20,
            }}
          >
            Tournament Details
          </Text>

          <View
            style={[
              StyleZ.loginFromContainer,
              {
                minHeight: 0,
              },
            ]}
          >
            {/*StyleZ.loginForm start*/}
            <View style={StyleZ.loginForm}>
              <View
                style={[
                  {
                    marginBottom:
                      BasePaddingsMargins.loginFormInputHolderMargin,
                  },
                ]}
              >
                <LFInput
                  label="Past Tournaments"
                  typeInput="dropdown"
                  items={items_past_tournaments}
                  placeholder="Select Past Tournament"
                  marginBottomInit={BasePaddingsMargins.m10}
                  // defaultValue="Select Past Tournament"
                  onChangeText={(keytext) => {
                    // // // // console.log('keytext:', keytext);
                    if (keytext !== '' && !isNaN(Number(keytext))) {
                      set_old_tournamentByKey(old_tournaments[Number(keytext)]);
                      // // // // console.log('It is adding the tournament old');
                    } else {
                      set_old_tournamentByKey(null);
                    }
                  }}
                />
                {old_tournamentByKey !== null ? (
                  <LFButton
                    type="primary"
                    label={`Copy details from: ${old_tournamentByKey?.tournament_name}, ID: ${old_tournamentByKey?.id_unique_number}`}
                    onPress={() => {
                      // // // // console.log('old_tournamentByKey:', old_tournamentByKey);
                      set_tournamentName(
                        old_tournamentByKey?.tournament_name as string,
                      );
                      // // // // console.log('old_tournamentByKey?.game_type:', old_tournamentByKey?.game_type);
                      set_gameType(old_tournamentByKey?.game_type as string);
                      set_tournamentFormat(
                        old_tournamentByKey?.format as string,
                      );

                      set_description(old_tournamentByKey.description);
                      set_equipment(old_tournamentByKey.equipment);
                      set_custom_equipment(
                        old_tournamentByKey.custom_equipment,
                      );

                      set_gameSpot(old_tournamentByKey.game_spot);
                      // set_date( old_tournamentByKey. );

                      // you must get the time if the client need this
                      // // // // // console.log(`old_tournamentByKey.strart_time: ${old_tournamentByKey.start_date}`);
                      // set_time( old_tournamentByKey.strart_time );

                      set_reportsToFargo(old_tournamentByKey.reports_to_fargo);
                      set_isOpenTournament(
                        old_tournamentByKey.is_open_tournament,
                      );
                      set_recurringTournament(old_tournamentByKey.is_recurring);

                      set_race(old_tournamentByKey.race_details);
                      set_tableSize(old_tournamentByKey.table_size);
                      set_numberOfTables(
                        old_tournamentByKey.number_of_tables.toString(),
                      );
                      set_maximumFargo(
                        old_tournamentByKey.max_fargo.toString(),
                      );

                      // this is still not programmed the client should say what it is
                      // set_requiredFargoGames( old_tournamentByKey );

                      set_tournamentFee(
                        old_tournamentByKey.tournament_fee.toString(),
                      );

                      set_venue(old_tournamentByKey.venue);
                      set_venueLat(old_tournamentByKey.venue_lat);
                      set_venueLng(old_tournamentByKey.venue_lng);
                      set_venueAddress(old_tournamentByKey.address);
                      set_phone_number(old_tournamentByKey.phone);

                      set_tournametn_thumbnail_type(
                        old_tournamentByKey.thumbnail_type,
                      );

                      set_tournametn_thumbnail_url(
                        old_tournamentByKey.thumbnail_url,
                      );
                    }}
                  />
                ) : null}
              </View>

              <LFInput
                pingValidation={pingValidation}
                keyboardType="default"
                label="*Tournament Director's Name"
                placeholder="Enter director's name..."
                marginBottomInit={BasePaddingsMargins.m10}
                onlyRead={true}
                defaultValue={''}
                value={tournamentDirectorName}
                onChangeText={(text: string) => {
                  set_tournamentDirectorName(text);
                  // setErrorForm('')
                }}
                validations={
                  [
                    // EInputValidation.Required,
                  ]
                }
              />
              <LFInput
                pingValidation={pingValidation}
                keyboardType="default"
                // label="*User Role and ID"
                placeholder="User role and ID..."
                onlyRead={true}
                defaultValue={user?.id_auto.toString()}
                value={`${getRoleLabel(
                  user?.role,
                )} ID: ${user?.id_auto.toString()}`}
                onChangeText={(text: string) => {
                  // set_tournamentDirectorName(text);
                  // setErrorForm('')
                }}
                validations={
                  [
                    // EInputValidation.Required,
                  ]
                }
              />

              <LFInput
                pingValidation={pingValidation}
                // set_isValid={set_tounamentNameIsValid}
                keyboardType="default"
                label="*Tournament name"
                placeholder="Enter tournament name..."
                value={tournamentName}
                defaultValue={''}
                onChangeText={(text: string) => {
                  set_tournamentName(text);
                  // setErrorForm('')
                  /*if(text!=='' && !tounamentNameIsValid){
                  set_tounamentNameIsValid(true);
                }*/
                }}
                validations={[EInputValidation.Required]}
              />

              {
                // <Text style={[{color: 'white'}]}>gameType: {gameType}</Text> //debugging
              }
              <LFInput
                pingValidation={pingValidation}
                typeInput="dropdown"
                keyboardType="default"
                label="*Game Type"
                placeholder="Select The Game Type"
                defaultValue={gameType}
                value={gameType}
                onChangeText={(text: string) => {
                  set_gameType(text);
                  // // // // // console.log('game type:', text);
                  // setErrorForm('')
                  if (text === '') {
                    set_tournametn_thumbnail_type(EIGameTypes.Ball8);
                  } else {
                    set_tournametn_thumbnail_type(text);
                  }
                }}
                validations={[EInputValidation.Required]}
                items={GameTypes}
              />

              <LFInput
                pingValidation={pingValidation}
                typeInput="dropdown"
                keyboardType="default"
                label="*Tournament Format"
                placeholder="Select The Format"
                defaultValue={tournamentFormat}
                value={tournamentFormat}
                onChangeText={(text: string) => {
                  set_tournamentFormat(text);
                  // setErrorForm('')
                }}
                validations={[EInputValidation.Required]}
                items={TournametFormats}
              />

              <LFInput
                keyboardType="default"
                label="*Game Spot"
                placeholder="Enter Game Spot"
                defaultValue={gameSpot}
                value={gameSpot}
                onChangeText={(text: string) => {
                  set_gameSpot(text);
                  // setErrorForm('')
                }}
                validations={[EInputValidation.Required]}
              />

              <LFInput
                pingValidation={pingValidation}
                keyboardType="default"
                label="*Race"
                placeholder="Enter race details..."
                defaultValue={''}
                value={race}
                onChangeText={(text: string) => {
                  set_race(text);
                  // setErrorForm('')
                }}
                validations={[EInputValidation.Required]}
              />

              <LFInput
                pingValidation={pingValidation}
                keyboardType="default"
                label="*Description"
                placeholder="Enter description..."
                typeInput="textarea"
                defaultValue={''}
                value={description}
                onChangeText={(text: string) => {
                  set_description(text);
                  // setErrorForm('')
                }}
                validations={[EInputValidation.Required]}
              />

              <LFInput
                pingValidation={pingValidation}
                keyboardType="numeric"
                label="*Maximum Fargo"
                placeholder="e.g., 550"
                description={
                  isMaximumFargoDisabled
                    ? 'Cannot set Maximum Fargo when Open Tournament is enabled'
                    : 'The highest Fargo Max Value allowed is 1000.'
                }
                defaultValue={maximumFargo}
                value={maximumFargo}
                onlyRead={isMaximumFargoDisabled}
                onChangeText={(text: string) => {
                  if (isMaximumFargoDisabled) return;
                  const N = Number(text);
                  if (!isNaN(N) && N > 1000) {
                    set_maximumFargo('1000');
                  } else {
                    set_maximumFargo(text);
                  }
                  // setErrorForm('')
                }}
                validations={[EInputValidation.Required]}
              />

              <LFInput
                pingValidation={pingValidation}
                keyboardType="numeric"
                label="*Required Fargo Games"
                placeholder="e.g., 10"
                defaultValue={requiredFargoGames}
                value={requiredFargoGames}
                onChangeText={(text: string) => {
                  set_requiredFargoGames(text);
                  // setErrorForm('')
                }}
                validations={[EInputValidation.Required]}
              />

              <LFInput
                keyboardType="numeric"
                textIconFront="$"
                label="Tournament Fee"
                defaultValue={tournamentFee}
                value={tournamentFee}
                onChangeText={(text: string) => {
                  set_tournamentFee(text);
                  // setErrorForm('')
                }}
                validations={
                  [
                    // EInputValidation.Required,
                    // EInputValidation.GreatThenZero
                  ]
                }
              />

              <LFInputsGrid
                label="Side Pots"
                labelAdd="Add Side Pot"
                inputs={[
                  { label: 'Name', placeholder: 'Enter Side Pot' },
                  { label: 'Fee', placeholder: '0.00', textIconFront: '$' },
                ]}
                rows_data={sidePots}
                set_rows_data={set_sidePots}
              />
              <LFInput
                pingValidation={pingValidation}
                typeInput="calendar"
                label="*Select a common tournament start time"
                value={date}
                onChangeText={(text) => {
                  set_date(text);
                }}
              />

              <LFInput
                pingValidation={pingValidation}
                typeInput="dropdown"
                keyboardType="default"
                label="*Select a common tournament start time"
                placeholder="Enter Tournament Start Time"
                description={`All times are in your local timezone: ${getCurrentTimezone()}`}
                defaultValue={time}
                value={time}
                onChangeText={(text: string) => {
                  set_time(text);
                  // setErrorForm('')
                }}
                validations={[EInputValidation.Required]}
                items={TimeItems}
              />

              <View
                style={[
                  {
                    marginBottom:
                      BasePaddingsMargins.loginFormInputHolderMargin,
                  },
                ]}
              >
                <UIPanel size="for-calendar">
                  <View style={{ marginBottom: BasePaddingsMargins.m10 }}>
                    <UIPanel size="for-calendar">
                      <LFCheckBox
                        label="Reports to Fargo"
                        type="slider-yes-no"
                        checked={reportsToFargo}
                        set_checked={set_reportsToFargo}
                      />
                    </UIPanel>
                  </View>
                  <View style={{ marginBottom: BasePaddingsMargins.m10 }}>
                    <UIPanel size="for-calendar">
                      <LFCheckBox
                        label="Open Tournament"
                        type="slider-yes-no"
                        checked={isOpenTournament}
                        set_checked={(value: boolean) => {
                          if (isOpenTournamentDisabled) return;
                          set_isOpenTournament(value);
                        }}
                      />
                      {isOpenTournamentDisabled && (
                        <Text
                          style={{
                            fontSize: TextsSizes.small,
                            color: BaseColors.warning,
                            marginTop: 5,
                          }}
                        >
                          ⚠️ Cannot enable Open Tournament when Maximum Fargo is
                          set
                        </Text>
                      )}
                    </UIPanel>
                  </View>
                  <View>
                    <UIPanel size="for-calendar">
                      <LFCheckBox
                        label="Recurring Tournament"
                        type="slider-yes-no"
                        checked={recurringTournament}
                        set_checked={set_recurringTournament}
                      />
                      {recurringTournament === true ? (
                        <View
                          style={[
                            {
                              marginTop: BasePaddingsMargins.m5,
                            },
                          ]}
                        >
                          {statusRecurringTournament === 'recurring-valid' ? (
                            <Text
                              style={[
                                {
                                  fontSize: TextsSizes.p,
                                  color: BaseColors.success,
                                },
                              ]}
                            >
                              ✓ This tournament will repeat every Thursday at
                              6:30 PM
                            </Text>
                          ) : (
                            <Text
                              style={[
                                {
                                  fontSize: TextsSizes.p,
                                  color: BaseColors.warning,
                                },
                              ]}
                            >
                              ⚠️ Please select both date and time for the
                              recurring tournament.
                            </Text>
                          )}
                        </View>
                      ) : null}
                    </UIPanel>
                  </View>
                </UIPanel>
              </View>

              <View style={[StyleZ.hr]} />

              {/* Tournament Director Smart Venue Selection */}
              {isTournamentDirector && (
                <LFDropdownTournamentDirectorVenues
                  selectedVenueId={selectedTDVenue?.id}
                  selectedTableSize={selectedTDTableSize}
                  selectedTableBrand={selectedTDTableBrand}
                  selectedTableCount={selectedTDTableCount}
                  onVenueChange={(venue) => {
                    setSelectedTDVenue(venue);
                    __selectVenue(venue); // Use existing venue selection logic
                  }}
                  onTableSizeChange={(tableSize, availableCount) => {
                    setSelectedTDTableSize(tableSize);
                    setAvailableTDTableCount(availableCount);
                    set_tableSize(tableSize); // Update form state
                  }}
                  onTableBrandChange={(brand) => {
                    setSelectedTDTableBrand(brand);
                  }}
                  onTableCountChange={(count) => {
                    setSelectedTDTableCount(count);
                    set_numberOfTables(count.toString()); // Update form state
                  }}
                />
              )}

              {/* Existing venue selection for other user types */}
              {!isTournamentDirector && (
                <>
                  <VenuesEditor
                    barOwner={user as ICAUserData}
                    sendBackTheValues={(venue: IVenue) => {
                      __selectVenue(venue);
                    }}
                  />

                  <LFDropdownVenues
                    listType="my-venues"
                    onChange={(venue: IVenue) => {
                      __selectVenue(venue);
                    }}
                  />
                  <LFDropdownVenues
                    listType="venues-i-am-added-on"
                    onChange={(venue: IVenue) => {
                      __selectVenue(venue);
                    }}
                  />
                </>
              )}

              {/*<View style={{
              marginBottom: BasePaddingsMargins.loginFormInputHolderMargin
            }}>
              <Text style={[
                StyleZ.h4
              ]}>Venue Information</Text>
            </View>*/}

              {/*<LFInput 
              keyboardType="default" label="*Equipment"
              placeholder="Select Equipment"
              typeInput="dropdown"
              defaultValue={
                ""
              }
              value={equipment}
              onChangeText={(text:string)=>{
                set_equipment(text);
                // setErrorForm('')
              }}
              validations={[
                EInputValidation.Required,
              ]}
              items={[
                {label:'Diamond Tables', value:'diamond-tables'},
                {label:'Rasson Tables', value:'rasson-tables'},
                {label:'Predator Tables', value:'predator-tables'},
                {label:'Brunswick Gold Crowns', value:'brunswick-gold-crowns'},
                {label:'Valley Tables', value:'valley-tables'},
              ]}
              />*/}

              {
                //<UICalendar />
              }

              {/*<DirectPlaceSearch 
              setVenueOut={(v:string)=>{
                set_venue(v);
              }} 
              setAddressOut={(va:string)=>{
                set_venueAddress(va);
              }} 
              setLatOut={set_venueLat}
              setLngOut={set_venueLng}
              />*/}

              <LFInput
                keyboardType="default"
                label="Address"
                typeInput="textarea"
                // onlyRead={true}
                defaultValue={venueAddress}
                value={venueAddress}
                placeholder="Address will be automatically filled..."
                onChangeText={(text: string) => {}}
                validations={[EInputValidation.Required]}
              />

              <LFInput
                pingValidation={pingValidation}
                keyboardType="phone-pad"
                label="*Phone Number"
                defaultValue={'*Enter Phone Number'}
                value={phone_number}
                placeholder="Enter contact phone number..."
                onChangeText={(text: string) => {
                  set_phone_number(text);
                }}
                validations={[EInputValidation.Required]}
              />

              <LFInputEquipment
                equipment={equipment}
                set_equipment={set_equipment}
                custom_equipment={custom_equipment}
                set_custom_equipment={set_custom_equipment}
                validations={[EInputValidation.Required]}
              />

              {/* Hide manual table inputs for Tournament Directors since they're handled by the smart component */}
              {!isTournamentDirector && (
                <>
                  <LFInput
                    pingValidation={pingValidation}
                    typeInput="dropdown"
                    placeholder="*Table Size"
                    defaultValue={tableSize}
                    items={ItemsTableSizes}
                    validations={[EInputValidation.Required]}
                    value={tableSize}
                    onChangeText={(text: string) => {
                      set_tableSize(text);
                    }}
                  />

                  <LFInput
                    pingValidation={pingValidation}
                    keyboardType="numeric"
                    label="*Number of Tables"
                    placeholder="Enter number of tables..."
                    description="The number of tables must be greater than zero."
                    defaultValue={numberOfTables}
                    value={numberOfTables}
                    onChangeText={(text: string) => {
                      set_numberOfTables(text);
                      // setErrorForm('')
                    }}
                    validations={[
                      EInputValidation.Required,
                      EInputValidation.GreatThenZero,
                    ]}
                  />
                </>
              )}

              <ThumbnailSelector
                set_thumbnail_url={set_tournametn_thumbnail_url}
                set_thumbnailType={set_tournametn_thumbnail_type}
                thumbnailType={tournametn_thumbnail_type}
              />

              {formErrorMessage !== '' ? (
                <View
                  style={{
                    justifyContent: 'center',
                    marginBottom: BasePaddingsMargins.m10,
                    marginInline: 'auto',
                  }}
                >
                  <Text
                    style={[
                      StyleZ.LFErrorMessage,
                      StyleZ.LFErrorMessage_addon_centered,
                    ]}
                  >
                    {formErrorMessage}
                  </Text>
                </View>
              ) : null}
              <LFButton
                type="primary"
                label="Submit Tournament"
                loading={loading}
                onPress={() => {
                  __SubmitTheTournament();
                }}
              />
            </View>
            {/*StyleZ.loginForm end*/}
          </View>
        </View>
      </ScreenScrollView>
      <ModalInfoMessage
        id={10}
        message={`Success! Tournament '${tournamentName}' has been created."`}
        buttons={[
          <LFButton
            label="Redirect to the tournaments page"
            type="primary"
            onPress={() => {
              // Tournament created successfully
              set_successModalVisible(false);
            }}
          />,
        ]}
        visible={successModalVisible}
        // visible={true}
        set_visible={set_successModalVisible}
      />
    </>
  );
}
