import { Text, View } from 'react-native';
import { ICAUserData, ITournament } from '../../hooks/InterfacesGlobal';
import ScreenBilliardThumbDetails from './ScreenBilliardThumbDetails';
import { StyleZ } from '../../assets/css/styles';
import Pagination from '../../components/UI/Pagination/Pagiination';
import { COUNT_TOURNAMENTS_IN_PAGE } from '../../hooks/constants';
import { useEffect, useState } from 'react';
import { useContextAuth } from '../../context/ContextAuth';
import { FetchTournaments_LikedByUser } from '../../ApiSupabase/CrudTournament';

export default function ScreenBilliardListTournaments({
  tournaments,
  set_selectedTournament,
  set_ScreenBilliardModalTournament_opened,
  offsetTournaments,
  totalCount,
  __LoadTheTournaments,
}: {
  tournaments: ITournament[];
  set_selectedTournament: (t: ITournament) => void;
  set_ScreenBilliardModalTournament_opened: (v: boolean) => void;
  offsetTournaments: number;
  totalCount: number;
  __LoadTheTournaments: (n?: number) => void;
}) {
  const { user } = useContextAuth();
  const [likedTournamentIds, setLikedTournamentIds] = useState<Set<string>>(
    new Set(),
  );

  const loadLikedTournaments = async () => {
    if (user) {
      try {
        const { likedtournaments } = await FetchTournaments_LikedByUser(
          user as ICAUserData,
        );
        if (likedtournaments) {
          const likedIds = new Set(
            likedtournaments
              .map((lt) => lt.tournamentobject.id)
              .filter((id): id is string => id !== undefined && id !== null),
          );

          // Debug logging to check ID matching
          console.log(
            'Liked tournament IDs from database:',
            Array.from(likedIds),
          );
          console.log(
            'Current tournaments IDs:',
            tournaments.map((t) => ({
              id: t.id,
              id_unique_number: t.id_unique_number,
            })),
          );
          setLikedTournamentIds(likedIds);
        }
      } catch (error) {
        console.error('Error loading liked tournaments:', error);
      }
    }
  };

  useEffect(() => {
    if (tournaments.length > 0) {
      console.log(
        'tournaments[0].id_unique_number:',
        tournaments[0].id_unique_number,
      );
    }
  }, [tournaments]);

  useEffect(() => {
    loadLikedTournaments();
  }, [user, tournaments]);

  return (
    <>
      <Pagination
        countPerPage={COUNT_TOURNAMENTS_IN_PAGE}
        offset={offsetTournaments}
        totalCount={totalCount}
        FLoadDataByOffset={__LoadTheTournaments}
        currentItemsCount={tournaments.length}
      />

      {tournaments.length === 0 ? (
        <View
          style={{
            minHeight: 300,
          }}
        >
          <Text
            style={[
              StyleZ.h3,
              {
                textAlign: 'center',
              },
            ]}
          >
            No tournaments found. Try adjusting your filters or search terms.
          </Text>
        </View>
      ) : (
        <View
          style={[
            {
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              minHeight: 300,
            },
          ]}
        >
          {tournaments.map((tournament: ITournament, key: number) => {
            const isLiked = tournament.id
              ? likedTournamentIds.has(tournament.id)
              : false;
            return (
              <ScreenBilliardThumbDetails
                key={`tournament-key-${tournament.id_unique_number}-${key}`}
                tournament={tournament}
                selectTournament={(t: ITournament) => {
                  set_selectedTournament(t);
                  set_ScreenBilliardModalTournament_opened(true);
                }}
                isLiked={isLiked}
                onLikeToggle={() => {
                  loadLikedTournaments(); // Reload liked tournaments after toggle
                }}
              />
            );
          })}
        </View>
      )}

      <Pagination
        countPerPage={COUNT_TOURNAMENTS_IN_PAGE}
        offset={offsetTournaments}
        totalCount={totalCount}
        FLoadDataByOffset={__LoadTheTournaments}
        currentItemsCount={tournaments.length}
      />
    </>
  );
}
