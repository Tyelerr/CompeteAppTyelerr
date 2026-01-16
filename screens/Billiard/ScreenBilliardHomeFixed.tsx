import { Image, Text, TouchableOpacity, View } from 'react-native';
import ScreenScrollView from '../ScreenScrollView';
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
import { ITournament, ITournamentFilters } from '../../hooks/InterfacesGlobal';
import UIBadge from '../../components/UI/UIBadge';
import { StyleZ } from '../../assets/css/styles';
import { Ionicons } from '@expo/vector-icons';
import ScreenBilliardThumbDetails from './ScreenBilliardThumbDetails';
import { useEffect, useState } from 'react';
import { FetchTournaments_Filters } from '../../ApiSupabase/CrudTournament';
import {
  fetchTournamentsSimple,
  fetchTournamentsNoStatus,
} from '../../ApiSupabase/SimpleTournamentFetch';
import { supabase } from '../../ApiSupabase/supabase';
import ScreenBilliardModalTournament from './ScreenBilliardModalTournament';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import GoogleLocationRadis from '../../components/google/GoogleLocationRadius';
import ScreenBilliardModalFilters from './ScreenBilliardModalFilters_Final';
import ZSlider from '../../components/UI/ZSlider/ZSlider';
import ScreenBilliardListTournaments from './ScreenBilliardListTournaments';
import { useContextAuth } from '../../context/ContextAuth';

export default function ScreenBilliardHomeFixed({
  hideTheThumbsNavigation,
}: {
  hideTheThumbsNavigation?: boolean;
}) {
  const { user } = useContextAuth();
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

  const [iHaveFiltersSelected, set_iHaveFiltersSelected] =
    useState<boolean>(false);

  const [reset_GoogleLocationRadis, set_reset_GoogleLocationRadis] =
    useState<boolean>(false);

  // for the radisu dropdown to rest after filters rest i will change the key
  const [GoogleLocationRadis_key, set_GoogleLocationRadis_key] =
    useState<number>(0);
  const [offsetTournaments, set_offsetTournaments] = useState<number>(0);
  const [totalCount, set_totalCount] = useState<number>(0);

  // Simple tournament loading function
  const __LoadTheTournamentsSimple = async () => {
    console.log('=== SIMPLE LOAD TOURNAMENTS ===');

    try {
      const { data, error } = await fetchTournamentsNoStatus();

      console.log('Simple load result:');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('Error loading tournaments:', error);
        set_tournaments([]);
        return;
      }

      if (data && Array.isArray(data)) {
        console.log('Setting tournaments:', data.length);
        set_tournaments(data as ITournament[]);
        set_totalCount(data.length);
      } else {
        console.log('No tournament data');
        set_tournaments([]);
        set_totalCount(0);
      }
    } catch (e) {
      console.error('Exception in simple load:', e);
      set_tournaments([]);
      set_totalCount(0);
    }
  };

  const __LoadTheTournaments = async (offset?: number) => {
    console.log('=== LoadTournaments STARTED ===');
    console.log('filtersForSearch:', JSON.stringify(filtersForSearch, null, 2));
    console.log('offset:', offset);

    try {
      const { data, error, dataTotalCount } = await FetchTournaments_Filters(
        filtersForSearch,
        offset,
      );

      console.log('=== FetchTournaments_Filters RESPONSE ===');
      console.log('data:', data);
      console.log('data length:', data ? data.length : 'null');
      console.log('error:', error);
      console.log('dataTotalCount:', dataTotalCount);

      if (error !== null) {
        console.error('ERROR in FetchTournaments_Filters:', error);
        // Don't fallback to simple fetch - respect the filters
        set_tournaments([]);
        set_totalCount(0);
      } else if (data !== null && Array.isArray(data)) {
        const __THeTournamets: ITournament[] = [];
        for (let i = 0; i < data.length; i++) {
          __THeTournamets.push(data[i] as ITournament);
        }
        set_tournaments(__THeTournamets);
        console.log('Tournaments loaded with filters:', __THeTournamets.length);
      } else {
        // No data means filters returned empty results - this is correct behavior
        console.log('No tournaments match the current filters');
        set_tournaments([]);
      }

      set_offsetTournaments(offset !== undefined ? offset : 0);
      set_totalCount(
        dataTotalCount !== null && dataTotalCount[0]
          ? (dataTotalCount[0].totalcount as number)
          : 0,
      );

      console.log('=== LoadTournaments ENDED ===');
      console.log('Final tournaments count:', tournaments.length);
      console.log(
        'Final total count:',
        dataTotalCount !== null && dataTotalCount[0]
          ? dataTotalCount[0].totalcount
          : 0,
      );
    } catch (catchError) {
      console.error('Exception in __LoadTheTournaments:', catchError);
      set_tournaments([]);
      set_totalCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      set_filtersForSearch((prevFilters) => ({
        ...prevFilters,
        zip_code: user.zip_code,
        state: user.home_state || undefined,
        city: user.home_city || undefined,
      }));
    }
    __LoadTheTournaments();
  }, [user]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      __LoadTheTournaments();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [filtersForSearch]);

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

  return (
    <>
      <ScreenScrollView>
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

        {/* DEBUG BUTTONS */}
        <View style={{ marginBottom: 16, flexDirection: 'row', gap: 8 }}>
          <LFButton
            label={`Load Simple (${tournaments.length})`}
            type="primary"
            onPress={__LoadTheTournamentsSimple}
          />
          <LFButton
            label="Check DB"
            type="secondary"
            onPress={async () => {
              console.log('=== CHECKING DATABASE ===');
              try {
                const { data, error } = await supabase
                  .from('tournaments')
                  .select('id, tournament_name, status, game_type')
                  .limit(5);
                console.log('Raw DB check:', { data, error });
                console.log(
                  'Tournament statuses:',
                  data?.map((t) => ({
                    name: t.tournament_name,
                    status: t.status,
                    game_type: t.game_type,
                  })),
                );
              } catch (e) {
                console.error('DB check error:', e);
              }
            }}
          />
        </View>

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

          <GoogleLocationRadis
            resetTheComponent={reset_GoogleLocationRadis}
            key={`GoogleLocationRadis-${GoogleLocationRadis_key}`}
            onChange={(
              location: string,
              lat: string,
              lng: string,
              radius: number,
            ) => {
              console.log('=== LOCATION RADIUS CHANGED ===');
              console.log(
                'Location:',
                location,
                'Lat:',
                lat,
                'Lng:',
                lng,
                'Radius:',
                radius,
              );

              const filtersAfterRadiusLocationChange: ITournamentFilters = {
                ...JSON.parse(JSON.stringify(filtersForSearch)),
                ...{
                  venue: location,
                  lat: lat,
                  lng: lng,
                  radius: radius,
                },
              } as ITournamentFilters;
              console.log(
                'Updated filtersForSearch:',
                JSON.stringify(filtersAfterRadiusLocationChange, null, 2),
              );
              set_filtersForSearch(filtersAfterRadiusLocationChange);
            }}
          />

          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
          >
            <View style={{ width: '48%' }}>
              <LFButton
                label="Filters"
                icon="filter"
                type={iHaveFiltersSelected ? 'success' : 'outline-dark'}
                onPress={() => {
                  set_modalFiltersOpened(!modalFiltersOpened);
                }}
              />
            </View>
            <View style={{ width: '48%' }}>
              <LFButton
                label="Reset Filters"
                icon="trash"
                type="primary"
                onPress={() => {
                  // Reset filters but keep radius at 25 miles as default
                  set_filtersForSearch({
                    radius: 25,
                  } as ITournamentFilters);
                  set_iHaveFiltersSelected(false);
                  set_GoogleLocationRadis_key(GoogleLocationRadis_key + 1);
                  set_reset_GoogleLocationRadis(!reset_GoogleLocationRadis);
                }}
              />
            </View>
          </View>
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

      {modalFiltersOpened === true ? (
        <ScreenBilliardModalFilters
          isOpened={modalFiltersOpened}
          F_isOpened={set_modalFiltersOpened}
          filtersOut={filtersForSearch}
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
            const updatedFilters = {
              ...filtersNew,
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
      ) : null}
    </>
  );
}
