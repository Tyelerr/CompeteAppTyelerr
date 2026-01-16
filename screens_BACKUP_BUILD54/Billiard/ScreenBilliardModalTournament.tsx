import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import {
  ETournamentStatuses,
  EUserRole,
  ITournament,
} from '../../hooks/InterfacesGlobal';
import UIBadge from '../../components/UI/UIBadge';
import { BaseColors, BasePaddingsMargins } from '../../hooks/Template';
import UIPanel from '../../components/UI/UIPanel';
import { format, parseISO } from 'date-fns';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { useEffect } from 'react';
import { ILFInputGridInput } from '../../components/LoginForms/LFInputsGrid';
import { useContextAuth } from '../../context/ContextAuth';
import { RecordTournamentView } from '../../ApiSupabase/CrudTournamentViews';

export default function ScreenBilliardModalTournament({
  tournament,
  isOpened,
  F_isOpened,
  ApproveTheTournament,
  DeleteTheTournament,
  DeclineTheTournament,
}: {
  tournament?: ITournament;
  isOpened: boolean;
  F_isOpened: (v: boolean) => void;
  ApproveTheTournament?: () => void;
  DeleteTheTournament?: () => void;
  DeclineTheTournament?: () => void;
}) {
  const { user } = useContextAuth();

  useEffect(() => {
    // Record tournament view when modal opens
    if (isOpened && tournament?.id) {
      const recordView = async () => {
        try {
          const result = await RecordTournamentView(
            tournament.id!, // Use tournament.id directly as string (UUID) with non-null assertion
            user || undefined,
            undefined, // IP address - would need to be passed from parent or detected
            navigator?.userAgent || 'React Native App',
          );

          if (result.success) {
            console.log('Tournament view recorded successfully');
          } else if (result.error === 'Already viewed within the last week') {
            console.log('User has already viewed this tournament this week');
          } else {
            console.log('Failed to record tournament view:', result.error);
          }
        } catch (error) {
          console.error('Error recording tournament view:', error);
        }
      };

      recordView();
    }
  }, [isOpened, tournament?.id, user]);

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w+/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
  };

  const __Item = (title: string, value: string, m?: number) => {
    return (
      <View
        style={[
          {
            marginBottom:
              m !== undefined ? m : BasePaddingsMargins.formInputMarginLess,
          },
        ]}
      >
        <Text style={[StyleZ.h5]}>{title}</Text>
        <Text style={[StyleZ.p]}>{value}</Text>
      </View>
    );
  };

  if (tournament === undefined) return null;

  return (
    <Modal animationType="fade" transparent={true} visible={isOpened}>
      <View style={[StyleModal.container]}>
        <TouchableOpacity
          style={[StyleModal.backgroundTouchableForClosing]}
          onPress={() => {
            F_isOpened(false);
          }}
        />

        <View style={[StyleModal.containerForFixedLayout]}>
          {/* Fixed Header */}
          <View
            style={[
              StyleModal.fixedHeader,
              { minHeight: 120, paddingBottom: 20 },
            ]}
          >
            {/* Close Button for Fixed Header */}
            <TouchableOpacity
              style={[
                StyleModal.closeButtonFixed,
                {
                  backgroundColor: BaseColors.danger,
                  borderRadius: 5,
                },
              ]}
              onPress={() => F_isOpened(false)}
            >
              <Text style={{ color: BaseColors.light, fontSize: 24 }}>×</Text>
            </TouchableOpacity>

            {/* Header Content - Vertical Stack */}
            <View
              style={{
                width: '100%',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Centered Title - First Row */}
              <Text
                style={[
                  StyleZ.h2,
                  {
                    color: BaseColors.light,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: BasePaddingsMargins.m15,
                  },
                ]}
              >
                Tournament Details
              </Text>

              {/* ID Badge and Status Badges - Second Row, underneath the title */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: BasePaddingsMargins.m5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    backgroundColor: BaseColors.primary,
                    paddingHorizontal: BasePaddingsMargins.m10,
                    paddingVertical: BasePaddingsMargins.m5,
                    borderRadius: BasePaddingsMargins.m10,
                  }}
                >
                  <Text
                    style={[
                      StyleZ.p,
                      { color: BaseColors.light, fontWeight: 'bold' },
                    ]}
                  >
                    ID: {tournament.id_unique_number}
                  </Text>
                </View>
                <UIBadge
                  label={toTitleCase(tournament.status || 'Active')}
                  type={
                    tournament.status === 'approved' ? 'primary' : 'default'
                  }
                />
                <UIBadge
                  label={toTitleCase(tournament.game_type)}
                  type="primary"
                />
              </View>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={[StyleModal.scrollableContent]}>
            <UIPanel>
              <Text style={[StyleZ.h3]}>Basic Information</Text>

              <View
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                  },
                ]}
              >
                <Text style={[StyleZ.h2]}>
                  {toTitleCase(tournament.tournament_name)}
                </Text>
              </View>
              <View
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                    marginBottom: BasePaddingsMargins.formInputMarginLess,
                  },
                ]}
              >
                <View
                  style={[
                    {
                      marginRight: BasePaddingsMargins.m10,
                    },
                  ]}
                >
                  <UIBadge
                    type="secondary"
                    label={toTitleCase(tournament.game_type)}
                  />
                </View>
                <View>
                  <UIBadge
                    type="primary"
                    label={toTitleCase(tournament.format)}
                  />
                </View>
              </View>

              {__Item(
                'Tournament Date & Time',
                format(
                  parseISO(tournament.start_date),
                  'EEEE MMM dd, yyyy h:mm aa',
                ),
              )}
              {__Item('Entry Fee', `$${tournament.tournament_fee}`)}
              {__Item('Tournament Director', 'not set')}
              {__Item('Player Count', 'not set')}
              {__Item('Description', tournament.description)}

              {tournament.side_pots &&
              Array.isArray(tournament.side_pots) &&
              tournament.side_pots.length > 0 ? (
                <View>
                  <Text style={[StyleZ.h5]}>Side Posts:</Text>
                  {tournament.side_pots.map(
                    (side_post: ILFInputGridInput[], key_side_post: number) => {
                      return (
                        <View
                          key={`side-post-${key_side_post}`}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                        >
                          {side_post !== undefined && Array.isArray(side_post)
                            ? side_post.map(
                                (
                                  side_post_cell: ILFInputGridInput,
                                  side_post_cell_key: number,
                                ) => {
                                  return (
                                    <View
                                      key={`sidepost-cell-${key_side_post}-${side_post_cell_key}`}
                                      style={{
                                        width: '48%',
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: BaseColors.othertexts,
                                        }}
                                      >
                                        {side_post_cell_key === 1 ? '$' : ''}
                                        {side_post_cell.value}
                                      </Text>
                                    </View>
                                  );
                                },
                              )
                            : null}
                        </View>
                      );
                    },
                  )}
                </View>
              ) : null}

              {/* Chip Allocations for Chip Tournaments */}
              {tournament.format === 'chip-tournament' &&
              tournament.chip_allocations &&
              Array.isArray(tournament.chip_allocations) &&
              tournament.chip_allocations.length > 0 ? (
                <View>
                  <Text style={[StyleZ.h5]}>Chips:</Text>
                  {tournament.chip_allocations.map(
                    (
                      chip_allocation: ILFInputGridInput[],
                      key_chip: number,
                    ) => {
                      return (
                        <View
                          key={`chip-allocation-${key_chip}`}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                        >
                          {chip_allocation !== undefined &&
                          Array.isArray(chip_allocation)
                            ? chip_allocation.map(
                                (
                                  chip_cell: ILFInputGridInput,
                                  chip_cell_key: number,
                                ) => {
                                  return (
                                    <View
                                      key={`chip-cell-${key_chip}-${chip_cell_key}`}
                                      style={{
                                        width: '48%',
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color:
                                            chip_cell_key === 0
                                              ? BaseColors.othertexts
                                              : BaseColors.warning,
                                        }}
                                      >
                                        {chip_cell_key === 0
                                          ? `${chip_cell.value} Chips`
                                          : `Fargo: ${chip_cell.value}`}
                                      </Text>
                                    </View>
                                  );
                                },
                              )
                            : null}
                        </View>
                      );
                    },
                  )}
                </View>
              ) : null}
            </UIPanel>

            <UIPanel>
              <Text style={[StyleZ.h3]}>Venue Information</Text>

              {__Item(
                'Venue Name',
                tournament.venues !== null && tournament.venues !== undefined
                  ? tournament.venues.venue
                  : tournament.venue,
              )}
              {__Item(
                'Address',
                tournament.venues !== null && tournament.venues !== undefined
                  ? tournament.address
                  : tournament.address,
              )}
              {__Item(
                'Phone Number',
                tournament.venues !== null && tournament.venues !== undefined
                  ? tournament.venues.phone
                  : tournament.phone,
              )}
              {__Item('Table Size', tournament.table_size)}
              {__Item(
                'Number of Tables',
                tournament.number_of_tables.toString(),
                0,
              )}
            </UIPanel>

            <UIPanel>
              <Text style={[StyleZ.h3]}>Tournament Settings</Text>

              <View
                style={[
                  {
                    marginBottom: BasePaddingsMargins.formInputMarginLess,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                  },
                ]}
              >
                {tournament.reports_to_fargo === true ? (
                  <View
                    style={{
                      marginRight: BasePaddingsMargins.m5,
                      marginBottom: BasePaddingsMargins.m5,
                    }}
                  >
                    <UIBadge label="Reports To Fargo" type="primary" />
                  </View>
                ) : null}
                {tournament.is_recurring === true ? (
                  <View
                    style={{
                      marginRight: BasePaddingsMargins.m5,
                      marginBottom: BasePaddingsMargins.m5,
                    }}
                  >
                    <UIBadge label="Recurring" type="primary" />
                  </View>
                ) : null}
                {tournament.is_open_tournament === true ? (
                  <View
                    style={{
                      marginRight: BasePaddingsMargins.m5,
                      marginBottom: BasePaddingsMargins.m5,
                    }}
                  >
                    <UIBadge label="Open Tournament" type="primary" />
                  </View>
                ) : null}
              </View>

              {__Item('Equipment', tournament.equipment)}
              {/* Hide Race and Game Spot for chip tournaments */}
              {tournament.format !== 'chip-tournament' && (
                <>
                  {__Item('Race', tournament.race_details)}
                  {__Item('Game Spot', tournament.game_spot, 0)}
                </>
              )}
            </UIPanel>
          </ScrollView>

          {/* Fixed Footer */}
          <View style={[StyleModal.fixedFooter]}>
            {user?.role === EUserRole.MasterAdministrator &&
            tournament.status === ETournamentStatuses.Pending ? (
              <>
                <LFButton
                  label="Approve"
                  type="success"
                  marginbottom={BasePaddingsMargins.m10}
                  onPress={() => {
                    F_isOpened(false);
                    if (ApproveTheTournament !== undefined)
                      ApproveTheTournament();
                  }}
                />
                <LFButton
                  label="Delete"
                  type="danger"
                  marginbottom={BasePaddingsMargins.m10}
                  onPress={() => {
                    F_isOpened(false);
                    if (DeleteTheTournament !== undefined)
                      DeleteTheTournament();
                  }}
                />
              </>
            ) : null}
            {user?.role === EUserRole.MasterAdministrator &&
            tournament.status === ETournamentStatuses.Approved ? (
              <>
                <LFButton
                  label="Decline"
                  type="success"
                  marginbottom={BasePaddingsMargins.m10}
                  onPress={() => {
                    F_isOpened(false);
                    if (DeclineTheTournament !== undefined)
                      DeclineTheTournament();
                  }}
                />
                <LFButton
                  label="Delete"
                  type="danger"
                  marginbottom={BasePaddingsMargins.m10}
                  onPress={() => {
                    F_isOpened(false);
                    if (DeleteTheTournament !== undefined)
                      DeleteTheTournament();
                  }}
                />
              </>
            ) : null}
            <LFButton
              label="Close"
              type="danger"
              onPress={() => {
                F_isOpened(false);
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
