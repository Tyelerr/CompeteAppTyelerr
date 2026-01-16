import {
  Image,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import ScreenScrollView, { ScreenScrollViewRef } from '../ScreenScrollView';
import ScreenBilliardThumb from './ScreenBilliardThumb';
import {
  fargo_rated_tournaments_thumb,
  tournament_thumb_10_ball,
  tournament_thumb_8_ball,
  tournament_thumb_9_ball,
} from '../../hooks/constants';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import {
  ITournament,
  ITournamentFilters,
  EIGameTypes,
} from '../../hooks/InterfacesGlobal';
import UIBadge from '../../components/UI/UIBadge';
import { StyleZ } from '../../assets/css/styles';
import { Ionicons } from '@expo/vector-icons';
import ScreenBilliardThumbDetails from './ScreenBilliardThumbDetails';
import { useEffect, useState, useRef } from 'react';
import { FetchTournaments_Filters } from '../../ApiSupabase/CrudTournament';
import ScreenBilliardModalTournament from './ScreenBilliardModalTournament';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LBButtonsGroup from '../../components/LoginForms/Button/LBButtonsGroup';
import LocationFilters from '../../components/LocationFilters/LocationFilters_CityResetFixed';
import ScreenBilliardModalFilters from './ScreenBilliardModalFilters_Final';
import ZSlider from '../../components/UI/ZSlider/ZSlider';
import ScreenBilliardListTournaments from './ScreenBilliardListTournaments';
import { useContextAuth } from '../../context/ContextAuth';
import { useNavigation } from '@react-navigation/native';

export default function ScreenBilliardHome({
  hideTheThumbsNavigation,
}: {
  hideTheThumbsNavigation?: boolean;
}) {
  const { user } = useContextAuth();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScreenScrollViewRef>(null);
  const [tournaments, set_tournaments] = useState<ITournament[]>([]);
  const [selectedTournament, set_selectedTournament] =
    useState<ITournament | null>(null);
  const [
    ScreenBilliardModalTournament_opened,
    set_ScreenBilliardModalTournament_opened,
  ] = useState<boolean>(false);
  const [modalFiltersOpened, set_modalFiltersOpened] = useState(false);
  const [filtersForSearch, set_filtersForSearch] = useState<ITournamentFilters>(
    {} as ITournamentFilters,
  );

  // Auto-populate zip_code filter from user profile on mount
  useEffect(() => {
    if (user) {
      set_filtersForSearch((prevFilters) => ({
        ...prevFilters,
        zip_code: user.zip_code,
        state: user.home_state || undefined,
        city: user.home_city || undefined,
      }));
    }
  }, [user]);

  const [iHaveFiltersSelected, set_iHaveFiltersSelected] =
    useState<boolean>(false);

  const [resetLocationFilters, setResetLocationFilters] =
    useState<boolean>(false);
  const [offsetTournaments, set_offsetTournaments] = useState<number>(0);
  const [totalCount, set_totalCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const __LoadTheTournaments = async (offset?: number) => {
    console.log('=== LoadTournaments STARTED ===');
    console.log('filtersForSearch:', JSON.stringify(filtersForSearch, null, 2));
    console.log('offset:', offset);

    const { data, error, dataTotalCount } = await FetchTournaments_Filters(
      filtersForSearch,
      offset,
    );

    console.log('=== FetchTournaments_Filters RESPONSE ===');
    console.log('data length:', data ? data.length : 'null');
    console.log('error:', error);
    console.log('dataTotalCount:', dataTotalCount);

    if (error !== null) {
      console.log('ERROR in FetchTournaments_Filters:', error);
    } else if (data !== null) {
      const __THeTournamets: ITournament[] = [];
      for (let i = 0; i < data.length; i++) {
        __THeTournamets.push(data[i] as ITournament);
      }
      set_tournaments(__THeTournamets);
      console.log('Tournaments loaded:', __THeTournamets.length);

      // FIXED: Calculate totalCount with fallback logic
      // If dataTotalCount is null or returns 0, but we have tournaments,
      // use the tournaments length as the count
      let calculatedTotalCount = 0;

      if (
        dataTotalCount !== null &&
        dataTotalCount[0]?.totalcount !== undefined
      ) {
        calculatedTotalCount = dataTotalCount[0].totalcount as number;
      }

      // Fallback: If count is 0 but we have tournaments, use tournaments length
      // This handles cases where the count query fails or returns incorrect data
      if (calculatedTotalCount === 0 && __THeTournamets.length > 0) {
        console.log('⚠️  WARNING: dataTotalCount is 0 but tournaments exist!');
        console.log(
          `   Using fallback: setting totalCount to ${__THeTournamets.length}`,
        );
        calculatedTotalCount = __THeTournamets.length;
      }

      set_offsetTournaments(offset !== undefined ? offset : 0);
      set_totalCount(calculatedTotalCount);

      console.log('=== LoadTournaments ENDED ===');
      console.log('totalCount set to:', calculatedTotalCount);
      console.log('tournaments length:', __THeTournamets.length);
    } else {
      // No data returned
      set_tournaments([]);
      set_offsetTournaments(offset !== undefined ? offset : 0);
      set_totalCount(0);
      console.log('=== LoadTournaments ENDED (no data) ===');
    }
  };

  const onRefresh = async () => {
    console.log('=== REFRESH STARTED ===');
    setRefreshing(true);
    try {
      // Reset to first page when refreshing
      await __LoadTheTournaments(0);
    } catch (error) {
      console.log('Error during refresh:', error);
    } finally {
      setRefreshing(false);
      console.log('=== REFRESH ENDED ===');
    }
  };

  useEffect(() => {
    __LoadTheTournaments();
  }, []);

  // Reset scroll position when user navigates away from this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Immediately scroll to top when leaving the screen
      scrollViewRef.current?.scrollToTop(false);
    });

    return unsubscribe;
  }, [navigation]);

  // FIXED: Use JSON.stringify for reliable dependency tracking
  // React's useEffect uses shallow comparison for objects, which may not detect
  // changes when object properties are updated. Converting to JSON string ensures
  // the effect triggers whenever ANY filter value changes.
  useEffect(() => {
    // Check if filters were applied from modal - if so, fetch immediately
    // Otherwise, debounce to avoid excessive fetches during typing
    const isModalFilter = filtersForSearch?.filtersFromModalAreAplied === true;

    if (isModalFilter) {
      // Immediate fetch for modal-applied filters
      console.log('=== IMMEDIATE FETCH: Modal filters applied ===');
      console.log('Filter values:', JSON.stringify(filtersForSearch, null, 2));
      __LoadTheTournaments();
    } else {
      // Debounce for search input and other real-time filters
      const timeoutId = setTimeout(() => {
        console.log('=== DEBOUNCED FETCH: Search/location filters ===');
        console.log(
          'Filter values:',
          JSON.stringify(filtersForSearch, null, 2),
        );
        __LoadTheTournaments();
      }, 300);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [JSON.stringify(filtersForSearch)]); // Convert to string for reliable comparison

  const TheThumbnails = [
    {
      title: 'Daily Tournaments',
      images: [
        tournament_thumb_8_ball,
        tournament_thumb_9_ball,
        tournament_thumb_10_ball,
      ],
      route: 'BilliardDailyTournaments',
    },
    {
      title: 'Fargo Rated Tournaments',
      images: [fargo_rated_tournaments_thumb],
      route: 'BilliardFargoRated',
    },
  ];

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[BaseColors.primary]} // Android
      tintColor={BaseColors.primary} // iOS
      title="Pull to refresh tournaments..." // iOS
      titleColor={BaseColors.othertexts} // iOS
    />
  );

  return (
    <>
      <ScreenScrollView ref={scrollViewRef} refreshControl={refreshControl}>
        {hideTheThumbsNavigation === true ? (
          <View
            style={{
              paddingBlock: BasePaddingsMargins.m10,
            }}
          />
        ) : (
          <View
            style={[
              {
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: BasePaddingsMargins.m10,
              },
            ]}
          >
            {TheThumbnails.map((obj, key: number) => {
              return (
                <ScreenBilliardThumb
                  title={obj.title}
                  images={obj.images}
                  routeName={obj.route}
                  key={`screen-billiard-${key}`}
                />
              );
            })}
          </View>
        )}

        {/*filters starts*/}
        <View
          style={[
            {
              marginBottom: BasePaddingsMargins.formInputMarginLess,
            },
          ]}
        >
          <LFInput
            placeholder="Search tournaments..."
            iconFront="search"
            marginBottomInit={BasePaddingsMargins.formInputMarginLess}
            onChangeText={(t: string) => {
              const newFilters = {
                ...JSON.parse(JSON.stringify(filtersForSearch)),
                ...{
                  search: t,
                },
              } as ITournamentFilters;
              console.log('=== SEARCH INPUT CHANGED ===');
              console.log('New search term:', t);
              console.log(
                'Updated filtersForSearch:',
                JSON.stringify(newFilters, null, 2),
              );
              set_filtersForSearch(newFilters);
            }}
          />

          <LocationFilters
            filters={filtersForSearch}
            onFiltersChange={(updatedFilters: ITournamentFilters) => {
              console.log('=== LOCATION FILTERS CHANGED ===');
              console.log(
                'Updated filters:',
                JSON.stringify(updatedFilters, null, 2),
              );
              console.log(
                'Current filtersForSearch before update:',
                JSON.stringify(filtersForSearch, null, 2),
              );

              // Force a new object reference to ensure React detects the change
              const newFilters = {
                ...updatedFilters,
                _timestamp: Date.now(), // Add timestamp to force re-render
              };

              console.log(
                'Setting new filtersForSearch:',
                JSON.stringify(newFilters, null, 2),
              );
              set_filtersForSearch(newFilters);
            }}
            resetComponent={resetLocationFilters}
            userProfile={user || undefined}
          />

          <LBButtonsGroup
            buttons={[
              <LFButton
                label="Filters"
                icon="filter"
                type={iHaveFiltersSelected ? 'success' : 'outline-dark'}
                onPress={() => {
                  set_modalFiltersOpened(!modalFiltersOpened);
                }}
              />,
              <LFButton
                label="Reset Filters"
                icon="trash"
                type="primary"
                onPress={() => {
                  console.log('=== RESET FILTERS CLICKED ===');
                  // Reset filters but keep radius at 25 miles as default
                  set_filtersForSearch({
                    radius: 25,
                  } as ITournamentFilters);
                  set_iHaveFiltersSelected(false);
                  // Reset location filters
                  setResetLocationFilters(!resetLocationFilters);
                }}
              />,
            ]}
          />
        </View>
        {/*Filters end*/}

        <ScreenBilliardListTournaments
          tournaments={tournaments}
          set_ScreenBilliardModalTournament_opened={
            set_ScreenBilliardModalTournament_opened
          }
          set_selectedTournament={set_selectedTournament}
          offsetTournaments={offsetTournaments}
          totalCount={totalCount}
          __LoadTheTournaments={__LoadTheTournaments}
        />
      </ScreenScrollView>

      {selectedTournament !== null ? (
        <ScreenBilliardModalTournament
          isOpened={ScreenBilliardModalTournament_opened}
          F_isOpened={set_ScreenBilliardModalTournament_opened}
          tournament={selectedTournament as ITournament}
        />
      ) : null}

      {
        /**/
        modalFiltersOpened === true ? (
          <ScreenBilliardModalFilters
            isOpened={modalFiltersOpened}
            F_isOpened={set_modalFiltersOpened}
            filtersOut={filtersForSearch}
            userProfile={user || undefined}
            set_FiltersOut={(filtersNew: ITournamentFilters) => {
              console.log('=== MODAL FILTERS APPLIED ===');
              console.log(
                'filtersNew from modal:',
                JSON.stringify(filtersNew, null, 2),
              );
              console.log(
                'filtersFromModalAreAplied:',
                filtersNew.filtersFromModalAreAplied,
              );
              // Create a new object to ensure useEffect triggers
              const updatedFilters = {
                ...filtersNew,
                // Force a timestamp to ensure object is different
                _timestamp: Date.now(),
              };
              console.log(
                'Setting filtersForSearch with updatedFilters:',
                JSON.stringify(updatedFilters, null, 2),
              );
              set_filtersForSearch(updatedFilters);
              set_iHaveFiltersSelected(
                updatedFilters.filtersFromModalAreAplied === true,
              );
              console.log(
                'iHaveFiltersSelected set to:',
                updatedFilters.filtersFromModalAreAplied === true,
              );
            }}
          />
        ) : null
      }

      {/*<ScreenBilliardModalFilters 
        isOpened={modalFiltersOpened}
        F_isOpened={set_modalFiltersOpened}
        filtersOut={filtersForSearch}
        set_FiltersOut={(filtersNew:ITournamentFilters)=>{
          set_filtersForSearch(filtersNew);
          set_iHaveFiltersSelected(true);
        }}
      />*/}
    </>
  );
}
