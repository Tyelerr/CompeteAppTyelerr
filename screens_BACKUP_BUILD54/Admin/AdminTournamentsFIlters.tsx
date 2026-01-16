import { View } from 'react-native';
import LFInput from '../../components/LoginForms/LFInput';
import { BasePaddingsMargins } from '../../hooks/Template';
import { useEffect, useState } from 'react';
import {
  ETournamentStatuses,
  GameTypes,
  ITournament,
  TournamentStatusesForDropdown,
} from '../../hooks/InterfacesGlobal';
import { FetchTournaments2 } from '../../ApiSupabase/CrudTournament';
import LFButton from '../../components/LoginForms/Button/LFButton';

export interface IAdminTournamentsFilters {
  searchingTerm: string;
  filterType: string;
  filterVenue: string;
  filterId: string;
  filterStatus: string;
  itemsForVenues: { label: string; value: string }[];
  sortBy: string;
  sortTypeIsAsc: boolean;
  filter_status: ETournamentStatuses | undefined;
}

export default function AdminTournamentsFIlters({
  set_filters,
  tournament_status_static_value,
}: {
  set_filters: (filters: IAdminTournamentsFilters) => void;
  tournament_status_static_value: ETournamentStatuses | undefined;
}) {
  const [searchingTerm, set_searchingTerm] = useState<string>('');
  const [filterType, set_filterType] = useState<string>('');
  const [filterVenue, set_filterVenue] = useState<string>('');
  const [filterId, set_filterId] = useState<string>('');
  const [filterStatus, set_filterStatus] = useState<string>('');
  const [itemsForVenues, set_itemsForVenues] = useState<
    { label: string; value: string }[]
  >([]);
  const [sortBy, set_sortBy] = useState<string>('id_unique_number');
  const [sortTypeIsAsc, set_sortTypeIsAsc] = useState<boolean>(false);

  const ___SetTheFilters = () => {
    set_filters({
      searchingTerm: searchingTerm,
      filterType: filterType,
      filterVenue: filterVenue,
      filterId: filterId,
      filterStatus: filterStatus,
      itemsForVenues: itemsForVenues,
      sortBy: sortBy,
      sortTypeIsAsc: sortTypeIsAsc,
      filter_status: tournament_status_static_value,
    } as IAdminTournamentsFilters);
  };

  useEffect(() => {
    ___SetTheFilters();
  }, [
    searchingTerm,
    filterType,
    filterVenue,
    filterId,
    filterStatus,
    itemsForVenues,
    sortBy,
    sortTypeIsAsc,
    tournament_status_static_value,
  ]);

  useEffect(() => {
    ___SetTheFilters();
  }, []);

  return (
    <View>
      <LFInput
        keyboardType="default"
        placeholder="Search tournaments..."
        iconFront="search"
        marginBottomInit={BasePaddingsMargins.formInputMarginLess}
        defaultValue=""
        onChangeText={(text: string) => {
          set_searchingTerm(text);
        }}
        validations={[]}
      />

      <View
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: BasePaddingsMargins.formInputMarginLess,
          },
        ]}
      >
        <View
          style={[
            {
              width: '48%',
            },
          ]}
        >
          <LFInput
            typeInput="dropdown"
            placeholder="All Types"
            label="Filter By Type"
            marginBottomInit={0}
            defaultValue=""
            onChangeText={(text: string) => {
              set_filterType(text);
            }}
            validations={[]}
            items={GameTypes}
          />
        </View>
        <View
          style={[
            {
              width: '48%',
            },
          ]}
        >
          <LFInput
            label="Filter by ID"
            placeholder="ID Number"
            keyboardType="number-pad"
            marginBottomInit={0}
            onChangeText={(text) => {
              set_filterId(text);
            }}
          />
        </View>
      </View>

      {/* Venue and Status Filters */}
      <View
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: BasePaddingsMargins.formInputMarginLess,
          },
        ]}
      >
        <View
          style={[
            {
              width: '48%',
            },
          ]}
        >
          <LFInput
            typeInput="dropdown"
            placeholder="All Venues"
            label="Filter By Venue"
            iconFront="pin"
            marginBottomInit={0}
            defaultValue=""
            onChangeText={(text: string) => {
              set_filterVenue(text);
            }}
            validations={[]}
            items={itemsForVenues}
          />
        </View>
        <View
          style={[
            {
              width: '48%',
            },
          ]}
        >
          <LFInput
            typeInput="dropdown"
            placeholder="Any Status"
            label="Status"
            iconFront="filter"
            marginBottomInit={0}
            defaultValue=""
            onChangeText={(text: string) => {
              set_filterStatus(text);
            }}
            validations={[]}
            items={TournamentStatusesForDropdown}
          />
        </View>
      </View>

      {/* Sorting Options */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginBottom: BasePaddingsMargins.formInputMarginLess,
        }}
      >
        <View
          style={{
            width: '70%',
            marginRight: BasePaddingsMargins.m10,
          }}
        >
          <LFInput
            typeInput="dropdown"
            placeholder="Sort by ID"
            label="Order By"
            marginBottomInit={0}
            defaultValue=""
            onChangeText={(text: string) => {
              set_sortBy(text);
            }}
            validations={[]}
            items={[
              { label: 'ID Number', value: 'id_unique_number' },
              { label: 'Date Created', value: 'created_at' },
              { label: 'Tournament Name', value: 'tournament_name' },
              { label: 'Start Date', value: 'start_date' },
              { label: 'Venue', value: 'venue' },
              { label: 'Entry Fee', value: 'tournament_fee' },
            ]}
          />
        </View>
        <View
          style={{
            width: 50,
          }}
        >
          <LFButton
            label=""
            icon={sortTypeIsAsc === true ? 'arrow-up' : 'arrow-down'}
            type="outline-dark"
            marginbottom={0}
            onPress={() => {
              set_sortTypeIsAsc(!sortTypeIsAsc);
            }}
          />
        </View>
      </View>
    </View>
  );
}
