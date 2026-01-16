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
import ScreenBilliardModalFilters from './ScreenBilliardModalFilters_BUILD161';
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

  // BUILD 181: Auto-populate state/city filter and user role from user profile on mount
  // NO LONGER auto-populate zip_code or radius - only use if user manually enters them
  useEffect(() => {
    if (user) {
      set_filtersForSearch((prevFilters) => ({
        ...prevFilters,
        state: user.home_state || undefined,
        city: user.home_city || undefined,
        userRole: user.role, // Pass user role for admin access
        // DO NOT set zip_code or radius by default
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
  const [guardrailTriggered, set_guardrailTriggered] = useState<boolean>(false);
  const [countSource, set_countSource] = useState<'REAL' | 'FALLBACK'>('REAL');

  const __LoadTheTournaments = async (offset?: number) => {
    console.log('=== BUILD 198: LoadTournaments STARTED ===');
    console.log('filtersForSearch:', JSON.stringify(filtersForSearch, null, 2));
    console.log('offset:', offset);

    const { tournaments, totalCount, error } = await FetchTournaments_Filters(
      filtersForSearch,
      offset,
    );

    console.log('=== BUILD 198: FetchTournaments_Filters RESPONSE ===');
    console.log('tournaments length:', tournaments.length);
    console.log('totalCount:', totalCount);
    console.log('error:', error);

    if (error !== null) {
      console.log('ERROR in FetchTournaments_Filters:', error);
      set_tournaments([]);
      set_offsetTournaments(offset !== undefined ? offset : 0);
      set_totalCount(0);
    } else {
      set_tournaments(tournaments);

      // BUILD 202: CRITICAL GUARDRAIL - Prevent pagination from breaking when count fails
      // If tournaments exist but totalCount is 0, the count pipeline is broken
      let finalCount = totalCount;

      if (tournaments.length > 0 && totalCount === 0) {
        // BUILD 204: Set guardrail state
        set_guardrailTriggered(true);
        set_countSource('FALLBACK');
        
        // COUNT PIPELINE BROKEN - Use intelligent fallback
        // Use offset + tournaments.length to account for previous pages
        // Example: On page 2 (offset=20), if we have 20 items, total is at least 40
        const minimumCount =
          (offset !== undefined ? offset : 0) + tournaments.length;
        finalCount = minimumCount;

        // Determine which filtering path was used
        const usingRadiusFilter =
          filtersForSearch.radius !== undefined &&
          filtersForSearch.radius !== null &&
          filtersForSearch.zip_code;
        const usingDaysOfWeekFilter =
          filtersForSearch.daysOfWeek && filtersForSearch.daysOfWeek.length > 0;
        const filteringPath =
          usingRadiusFilter || usingDaysOfWeekFilter
            ? 'CLIENT-SIDE (radius/daysOfWeek)'
            : 'DATABASE-ONLY (state/city)';

        const isAdmin =
          filtersForSearch.userRole === 'master-administrator' ||
          filtersForSearch.userRole === 'compete-admin';

        console.error(
          '╔════════════════════════════════════════════════════════╗',
        );
        console.error(
          '║   🚨🚨🚨 BUILD 202: COUNT PIPELINE BROKEN 🚨🚨🚨      ║',
        );
        console.error(
          '╚════════════════════════════════════════════════════════╝',
        );
        console.error('');
        console.error('📊 BASIC INFO:');
        console.error('   Tournaments exist but totalCount is 0!');
        console.error('   tournaments.length:', tournaments.length);
        console.error('   offset:', offset);
        console.error('   Calculated minimum count:', minimumCount);
        console.error('');
        console.error('🔍 FILTERING PATH:');
        console.error('   Path used:', filteringPath);
        console.error('   Radius filter active:', usingRadiusFilter);
        console.error('   Days of week filter active:', usingDaysOfWeekFilter);
        console.error('');
        console.error('👤 USER CONTEXT:');
        console.error('   User role:', filtersForSearch.userRole || 'none');
        console.error('   Is admin:', isAdmin);
        console.error('');
        console.error('🎯 ACTIVE FILTERS (Full Object):');
        console.error(JSON.stringify(filtersForSearch, null, 2));
        console.error('');
        console.error('📋 KEY FILTERS APPLIED:');
        console.error('   state:', filtersForSearch.state || 'none');
        console.error('   city:', filtersForSearch.city || 'none');
        console.error('   zip_code:', filtersForSearch.zip_code || 'none');
        console.error('   radius:', filtersForSearch.radius || 'none');
        console.error('   game_type:', filtersForSearch.game_type || 'none');
        console.error('   format:', filtersForSearch.format || 'none');
        console.error('   search:', filtersForSearch.search || 'none');
        console.error('');
        console.error('🔧 DIAGNOSIS HINTS:');
        console.error('   Possible causes:');
        console.error('   1. RLS policy blocking count query');
        console.error(
          '   2. Missing filters in count query (filter parity issue)',
        );
        console.error('   3. Different code path skipping count');
        console.error('   4. Count query using wrong table/view');
        console.error('');
        console.error('💡 SQL EQUIVALENT (inferred):');
        console.error('   Table: tournaments');
        console.error('   WHERE is_recurring_master != true');
        if (!isAdmin) {
          console.error("   AND status = 'active'");
          console.error('   AND start_date >= TODAY');
        }
        if (filtersForSearch.state) {
          console.error(`   AND address ILIKE '%${filtersForSearch.state}%'`);
        }
        if (filtersForSearch.city) {
          console.error(`   AND address ILIKE '%${filtersForSearch.city}%'`);
        }
        console.error('');
        console.error('✅ FALLBACK APPLIED:');
        console.error('   Using: offset + tournaments.length =', minimumCount);
        console.error(
          '╚════════════════════════════════════════════════════════╝',
        );
      } else {
        // BUILD 204: Count is working correctly
        set_guardrailTriggered(false);
        set_countSource('REAL');
        
        if (totalCount === null || totalCount === undefined) {
        // Fallback if totalCount is null/undefined
        finalCount = tournaments.length;
        console.warn(
          '⚠️ BUILD 202: totalCount is null/undefined, using tournaments.length',
        );
      }

      set_offsetTournaments(offset !== undefined ? offset : 0);
      set_totalCount(finalCount);
      }

      console.log('=== BUILD 202: LoadTournaments COMPLETE ===');
      console.log('Tournaments loaded:', tournaments.length);
      console.log('Total count (final):', finalCount);
      console.log('Expected pages:', Math.ceil(finalCount / 20));
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

  // BUILD 161 FIX: Improved filter change detection
  // Use a combination of JSON.stringify and explicit filter tracking
  useEffect(() => {
    console.log('🔄 FILTER CHANGE DETECTED (BUILD 161)');
    console.log(
      '📋 Current filtersForSearch:',
      JSON.stringify(filtersForSearch, null, 2),
    );

    const isModalFilter = filtersForSearch?.filtersFromModalAreAplied === true;

    if (isModalFilter) {
      // Immediate fetch for modal-applied filters
      console.log('⚡ IMMEDIATE FETCH: Modal filters applied');
      __LoadTheTournaments(0); // Reset to page 0 when filters change
    } else {
      // Debounce for search input and other real-time filters
      const timeoutId = setTimeout(() => {
        console.log('⏱️ DEBOUNCED FETCH: Search/location filters');
        __LoadTheTournaments(0); // Reset to page 0 when filters change
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [
    filtersForSearch?.search,
    filtersForSearch?.game_type,
    filtersForSearch?.format,
    filtersForSearch?.table_size,
    filtersForSearch?.equipment,
    filtersForSearch?.equipment_custom,
    filtersForSearch?.dateFrom,
    filtersForSearch?.dateTo,
    filtersForSearch?.city,
    filtersForSearch?.state,
    filtersForSearch?.zip_code,
    filtersForSearch?.radius,
    filtersForSearch?.is_open_tournament,
    filtersForSearch?.reports_to_fargo,
    filtersForSearch?.minimun_required_fargo_games_10plus,
    filtersForSearch?.entryFeeFrom,
    filtersForSearch?.entryFeeTo,
    filtersForSearch?.fargoRatingFrom,
    filtersForSearch?.fargoRatingTo,
    JSON.stringify(filtersForSearch?.daysOfWeek),
    filtersForSearch?._timestamp,
  ]);

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

  // BUILD 200: RENDER-LEVEL DEBUG - Log state right before render
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       BUILD 200: RENDER-LEVEL STATE DEBUG             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('📊 State at render time:');
  console.log(`   tournaments.length: ${tournaments.length}`);
  console.log(`   totalCount: ${totalCount}`);
  console.log(`   offsetTournaments: ${offsetTournaments}`);
  console.log(`   Current page: ${Math.floor(offsetTournaments / 20) + 1}`);
  console.log(`   Data source for list: tournaments array`);
  console.log(`   Passing to Pagination component:`);
  console.log(`     - totalCount: ${totalCount}`);
  console.log(`     - currentItemsCount: ${tournaments.length}`);
  console.log(`     - offset: ${offsetTournaments}`);
  if (tournaments.length > 0) {
    console.log(`   First tournament: ${tournaments[0].tournament_name}`);
  }
  console.log('╚════════════════════════════════════════════════════════╝');

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
                userRole: user?.role, // Preserve user role for admin access
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
                  // BUILD 181: Reset filters to default (home state only, no radius)
                  // Only set radius if user manually enters a zip code
                  set_filtersForSearch({
                    state: user?.home_state || undefined,
                    city: user?.home_city || undefined,
                    userRole: user?.role, // Preserve user role for admin access
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
              console.log('🎯 === MODAL FILTERS RECEIVED (BUILD 161) ===');
              console.log(
                '📥 Filters from modal:',
                JSON.stringify(filtersNew, null, 2),
              );

              // Create completely new object with timestamp to force re-render
              const updatedFilters: ITournamentFilters = {
                ...filtersNew,
                _timestamp: Date.now(),
                userRole: user?.role,
              };

              console.log(
                '📤 Setting filtersForSearch:',
                JSON.stringify(updatedFilters, null, 2),
              );
              set_filtersForSearch(updatedFilters);
              set_iHaveFiltersSelected(
                updatedFilters.filtersFromModalAreAplied === true,
              );
              console.log('✅ Filter state updated successfully');
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
