import { Image, Text, TouchableOpacity, View } from 'react-native';
import { StyleTournamentsAdmin, StyleZ } from '../../assets/css/styles';
import UIPanel from '../../components/UI/UIPanel';
import {
  ETournamentStatuses,
  EUserRole,
  ITournament,
} from '../../hooks/InterfacesGlobal';
import {
  getThurnamentStaticThumb,
  THUMBNAIL_CUSTOM,
} from '../../hooks/constants';
import UIBadge from '../../components/UI/UIBadge';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import LFButton from '../../components/LoginForms/Button/LFButton';
import {
  UpdateTournament,
  DeleteTournament,
} from '../../ApiSupabase/CrudTournament';
import { useContextAuth } from '../../context/ContextAuth';
import { useEffect, useState } from 'react';
import ScreenBilliardModalTournament from '../Billiard/ScreenBilliardModalTournament';
import { getLocalTimestampWithoutTimezone } from '../../hooks/hooks';
import { toTitleCase } from '../../utils/StringHelpers';

export default function TournamentThumbnailAdmin({
  tournament,
  reloadTheTournaments,
}: {
  tournament: ITournament;
  reloadTheTournaments?: () => void;
}) {
  const { user } = useContextAuth();

  const [modalForTournamentIsOpened, set_modalForTournamentIsOpened] =
    useState<boolean>(false);
  const [selectedTournamentForTheModal, set_selectedTournamentForTheModal] =
    useState<ITournament | null>(null);

  // const [statusOverwrite, set_statusOverwrite] = usest

  const ___ApproveTournament = async () => {
    // // // // // // console.log('tournament for editing: ', tournament);

    const { data, error } = await UpdateTournament(tournament, {
      status: ETournamentStatuses.Approved,
    });

    // // // // // // console.log('reloadTheTournaments function: ', reloadTheTournaments);

    if (reloadTheTournaments !== undefined) {
      // // // // // // console.log('Reloading the tournaments');
      reloadTheTournaments();
    }
  };
  const ___MakePendingTournament = async () => {
    // // // // // // console.log('tournament for editing: ', tournament);

    const { data, error } = await UpdateTournament(tournament, {
      status: ETournamentStatuses.Pending,
    });

    // // // // // // console.log('reloadTheTournaments function: ', reloadTheTournaments);

    if (reloadTheTournaments !== undefined) {
      // // // // // // console.log('Reloading the tournaments');
      reloadTheTournaments();
    }
  };

  const ___DeleteTournament = async () => {
    try {
      console.log(
        '🗑️ Deleting tournament with archival:',
        tournament.id_unique_number,
      );

      // Use the proper DeleteTournament function which archives the tournament
      const result = await DeleteTournament(
        tournament.id!,
        user?.id,
        'admin_deletion',
      );

      if (result.success) {
        console.log('✅ Tournament deleted and archived successfully');
        if (reloadTheTournaments !== undefined) {
          console.log('Reloading the tournaments');
          reloadTheTournaments();
        }
      } else {
        console.error('❌ Error deleting tournament:', result.error);
        // Fallback to old method if archival fails
        console.log('Falling back to status update method');
        const { data, error } = await UpdateTournament(tournament, {
          status: ETournamentStatuses.Deleted,
          deleted_at: getLocalTimestampWithoutTimezone(new Date()),
        });

        if (reloadTheTournaments !== undefined) {
          reloadTheTournaments();
        }
      }
    } catch (error) {
      console.error('❌ Exception during tournament deletion:', error);
      // Fallback to old method if there's an exception
      console.log('Falling back to status update method due to exception');
      const { data, error: updateError } = await UpdateTournament(tournament, {
        status: ETournamentStatuses.Deleted,
        deleted_at: getLocalTimestampWithoutTimezone(new Date()),
      });

      if (reloadTheTournaments !== undefined) {
        reloadTheTournaments();
      }
    }
  };

  const ___DeclientTournament = async () => {
    const { data, error } = await UpdateTournament(tournament, {
      status: ETournamentStatuses.Pending,
    });

    // // // // // // console.log('reloadTheTournaments function: ', reloadTheTournaments);

    if (reloadTheTournaments !== undefined) {
      // // // // // // console.log('Reloading the tournaments');
      reloadTheTournaments();
    }
  };

  useEffect(() => {
    // // // // // // console.log('loggeduser: ', user);
  }, []);

  return (
    <>
      <UIPanel>
        <TouchableOpacity
          onPress={() => {
            set_selectedTournamentForTheModal(tournament);
            set_modalForTournamentIsOpened(true);
          }}
        >
          <View
            style={{
              position: 'relative',
            }}
          >
            <View
              style={[
                {
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                  marginBottom: BasePaddingsMargins.m15,
                },
              ]}
            >
              <View style={[{ width: 100 }]}>
                <View /*onPress={()=>{
            set_selectedTournamentForTheModal(tournament);
            set_modalForTournamentIsOpened(true);
          }}*/
                >
                  {tournament.thumbnail_type === THUMBNAIL_CUSTOM ? (
                    <Image
                      style={[
                        StyleTournamentsAdmin.image,
                        // {opacity: 0}
                        StyleTournamentsAdmin.imageSmall,
                      ]}
                      source={{ uri: tournament.thumbnail_url }}
                    />
                  ) : getThurnamentStaticThumb(tournament.thumbnail_type) !==
                    null ? (
                    <Image
                      style={[
                        StyleTournamentsAdmin.image,
                        StyleTournamentsAdmin.imageSmall,
                      ]}
                      source={getThurnamentStaticThumb(
                        tournament.thumbnail_type,
                      )}
                    />
                  ) : null}
                </View>
              </View>
              <View
                style={[
                  {
                    flex: 1,
                    // backgroundColor: 'red',
                    paddingLeft: BasePaddingsMargins.m10,
                  },
                ]}
              >
                <View>
                  <Text
                    style={[
                      StyleTournamentsAdmin.title,
                      StyleTournamentsAdmin.titleV2,
                    ]}
                  >
                    {tournament.tournament_name !== ''
                      ? toTitleCase(tournament.tournament_name)
                      : '-tournament name is missing-'}
                  </Text>
                </View>
                <View style={StyleTournamentsAdmin.badgesHolder}>
                  <View style={StyleTournamentsAdmin.badgeHolder}>
                    <UIBadge
                      type="secondary"
                      label={
                        tournament.game_type === ''
                          ? '-not defined-'
                          : tournament.game_type
                      }
                    />
                  </View>
                  <View style={StyleTournamentsAdmin.badgeHolder}>
                    <UIBadge label={`ID: ${tournament.id_unique_number}`} />
                  </View>
                </View>
              </View>
            </View>

            {user?.role === EUserRole.MasterAdministrator ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0 - BasePaddingsMargins.m40,
                  right: 0 - BasePaddingsMargins.m30,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                {
                  // tournament.status===ETournamentStatuses.Pending
                  /*tournament
            ?
            <View style={{
              width: 40,
              marginLeft: BasePaddingsMargins.m10
            }}>
              <LFButton label="" icon="open" type="primary" size="small" onPress={()=>{
                // ___ApproveTournament()
                set_selectedTournamentForTheModal(tournament);
                set_modalForTournamentIsOpened(true);
              }} />
            </View>
            :
            null*/
                }

                {/*tournament.status!==ETournamentStatuses.Deleted
            ?
            <View style={{
              width: 40,
              marginLeft: BasePaddingsMargins.m10
            }}>
              <LFButton label="" icon="trash" type="danger" size="small" onPress={()=>{
                ___DeleteTournament()
              }} />
            </View>
            :
            null*/}
                {}
              </View>
            ) : null}
          </View>
          <View>
            <Text
              style={[
                {
                  color: BaseColors.othertexts,
                },
              ]}
            >
              Tournament Date:{' '}
              {new Date(tournament.start_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>

            {tournament.status === ETournamentStatuses.Deleted ? (
              <Text
                style={[
                  {
                    color: BaseColors.danger,
                  },
                ]}
              >
                Deleting Date:{' '}
                {tournament.deleted_at !== '' &&
                tournament.deleted_at !== null &&
                tournament.deleted_at !== undefined
                  ? new Date(tournament.deleted_at).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' },
                    )
                  : '-'}
              </Text>
            ) : null}

            <Text style={StyleTournamentsAdmin.p}>
              Location:{' '}
              {tournament.venues !== null && tournament.venues !== undefined
                ? tournament.venues.venue
                : tournament.venue}
            </Text>
            <Text style={StyleTournamentsAdmin.p}>
              Entry Fee: ${tournament.tournament_fee}
            </Text>
            <Text style={StyleTournamentsAdmin.p}>Player Count: 0</Text>
          </View>

          <View
            style={[
              StyleZ.hr,
              {
                marginBlock: BasePaddingsMargins.m15,
                marginBottom: BasePaddingsMargins.m15,
              },
            ]}
          />

          <View>
            <Text style={StyleTournamentsAdmin.p}>
              Tournament Director: {tournament.director_name}
            </Text>
            <Text style={StyleTournamentsAdmin.p}>
              Submitted by:{' '}
              {tournament.profiles !== null
                ? tournament.profiles.email.split('@')[0]
                : '--undefined creator--'}
            </Text>
          </View>
          {tournament.status === ETournamentStatuses.Pending ? (
            <View
              style={[
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  marginTop: BasePaddingsMargins.formInputMarginLess,
                },
              ]}
            >
              <View style={[{ width: '47%' }]}>
                <LFButton
                  label="Approve"
                  type="primary"
                  size="small"
                  onPress={() => {
                    ___ApproveTournament();
                  }}
                />
              </View>
              <View style={[{ width: '47%' }]}>
                <LFButton
                  label="Deny"
                  type="danger"
                  size="small"
                  onPress={() => {
                    ___DeleteTournament();
                  }}
                />
              </View>
            </View>
          ) : null}
          {tournament.status === ETournamentStatuses.Deleted ? (
            <View
              style={[
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  marginTop: BasePaddingsMargins.formInputMarginLess,
                },
              ]}
            >
              <View style={[{ width: '47%' }]}>
                <LFButton
                  label="Restore To Pending"
                  type="primary"
                  size="small"
                  onPress={() => {
                    ___MakePendingTournament();
                  }}
                />
              </View>
              <View style={[{ width: '47%' }]}>
                <LFButton
                  label="Restore To Approved"
                  type="success"
                  size="small"
                  onPress={() => {
                    ___ApproveTournament();
                  }}
                />
              </View>
            </View>
          ) : null}
        </TouchableOpacity>
      </UIPanel>

      {
        // selectedTournamentForTheModal!==null?
        modalForTournamentIsOpened === true &&
        selectedTournamentForTheModal !== null ? (
          <ScreenBilliardModalTournament
            F_isOpened={set_modalForTournamentIsOpened}
            isOpened={modalForTournamentIsOpened}
            tournament={selectedTournamentForTheModal}
            ApproveTheTournament={() => {
              ___ApproveTournament();
            }}
            DeleteTheTournament={() => {
              ___DeleteTournament();
            }}
            DeclineTheTournament={() => {
              ___DeclientTournament();
            }}
          />
        ) : null
      }
    </>
  );
}
