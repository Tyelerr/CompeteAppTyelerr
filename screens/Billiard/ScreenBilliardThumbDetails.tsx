import { Image, Text, TouchableOpacity, View } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import {
  getThurnamentStaticThumb,
  THUMBNAIL_CUSTOM,
  tournament_thumb_8_ball,
} from '../../hooks/constants';
import { ICAUserData, ITournament } from '../../hooks/InterfacesGlobal';
import { StyleZ } from '../../assets/css/styles';
import UIBadge from '../../components/UI/UIBadge';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useContextAuth } from '../../context/ContextAuth';
import {
  openAddressInMaps,
  openCoordinatesInMaps,
} from '../../utils/MapsHelper';
import { AddTournamentLike } from '../../ApiSupabase/CrudTournament';

export default function ScreenBilliardThumbDetails({
  tournament,
  selectTournament,
  isLiked,
  onLikeToggle,
}: {
  tournament: ITournament;
  selectTournament?: (t: ITournament) => void;
  isLiked?: boolean;
  onLikeToggle?: () => void;
}) {
  const { user } = useContextAuth();

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w+/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
  };

  return (
    <View
      style={[
        {
          width: '48%',
          marginBottom: BasePaddingsMargins.m15,
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: BaseColors.othertexts,
          backgroundColor: BaseColors.secondary,
          borderRadius: BasePaddingsMargins.m10,
          display: 'flex',
          position: 'relative',
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          if (selectTournament !== undefined) selectTournament(tournament);
        }}
      >
        <Image
          source={
            tournament.thumbnail_type === THUMBNAIL_CUSTOM
              ? { uri: tournament.thumbnail_url }
              : getThurnamentStaticThumb(tournament.game_type) ||
                tournament_thumb_8_ball
          }
          style={[
            {
              width: '100%',
              height: 120,
              borderTopLeftRadius: BasePaddingsMargins.m10,
              borderTopRightRadius: BasePaddingsMargins.m10,
            },
          ]}
        />
        <View
          style={[
            {
              padding: BasePaddingsMargins.m10,
            },
          ]}
        >
          <View
            style={[
              {
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: BasePaddingsMargins.m10,
              },
            ]}
          >
            <Text
              style={[
                StyleZ.p,
                {
                  color: BaseColors.light,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: BasePaddingsMargins.m5,
                },
              ]}
            >
              {toTitleCase(tournament.tournament_name)}
            </Text>
            <UIBadge label={toTitleCase(tournament.game_type)} type="default" />
          </View>
          <Text
            style={[
              StyleZ.p,
              {
                marginBottom: BasePaddingsMargins.m10,
                textAlign: 'center',
              },
            ]}
          >
            {format(
              parseISO(tournament.start_date),
              'EEEE MMM dd, yyyy h:mm aa',
            )}
          </Text>

          <View style={{ alignItems: 'center' }}>
            <View
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: BasePaddingsMargins.m5,
                },
              ]}
            >
              <Ionicons
                name="location"
                style={[
                  StyleZ.p,
                  {
                    marginRight: BasePaddingsMargins.m5,
                  },
                ]}
              />
              <Text
                style={[
                  StyleZ.p,
                  {
                    textAlign: 'center',
                    flex: 1,
                  },
                ]}
              >
                {tournament.venues !== null && tournament.venues !== undefined
                  ? tournament.venues.venue
                  : tournament.venue}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const address =
                  tournament.venues !== null && tournament.venues !== undefined
                    ? tournament.venues.address
                    : tournament.address;
                const venueName =
                  tournament.venues !== null && tournament.venues !== undefined
                    ? tournament.venues.venue
                    : tournament.venue;

                // Try to use coordinates first if available, fallback to address
                if (
                  tournament.venues?.venue_lat &&
                  tournament.venues?.venue_lng
                ) {
                  await openCoordinatesInMaps(
                    parseFloat(tournament.venues.venue_lat.toString()),
                    parseFloat(tournament.venues.venue_lng.toString()),
                    venueName,
                  );
                } else if (tournament.venue_lat && tournament.venue_lng) {
                  await openCoordinatesInMaps(
                    parseFloat(tournament.venue_lat.toString()),
                    parseFloat(tournament.venue_lng.toString()),
                    venueName,
                  );
                } else {
                  await openAddressInMaps(address, venueName);
                }
              }}
              style={{
                paddingVertical: 2,
                alignItems: 'center',
              }}
            >
              <Text
                style={[
                  StyleZ.p,
                  {
                    color: BaseColors.primary,
                    textDecorationLine: 'underline',
                    textAlign: 'center',
                  },
                ]}
              >
                {tournament.venues !== null && tournament.venues !== undefined
                  ? tournament.venues.address
                  : tournament.address}
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              StyleZ.hr,
              {
                marginBlock: BasePaddingsMargins.m15,
                marginBottom: BasePaddingsMargins.m15,
                backgroundColor: BaseColors.othertexts,
              },
            ]}
          />

          <View
            style={[
              {
                flexDirection: 'column',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              style={[
                StyleZ.p,
                {
                  margin: 0,
                  fontSize: TextsSizes.small,
                  textAlign: 'center',
                  marginBottom: BasePaddingsMargins.m5,
                },
              ]}
            >
              Tournament Fee
            </Text>
            <Text
              style={[
                StyleZ.h4,
                {
                  margin: 0,
                  textAlign: 'center',
                },
              ]}
            >
              ${tournament.tournament_fee}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ID Badge positioned on the left */}
      <View
        style={{
          position: 'absolute',
          left: BasePaddingsMargins.m5,
          top: BasePaddingsMargins.m5,
        }}
      >
        <UIBadge label={`ID:${tournament.id_unique_number}`} />
      </View>

      {/* Heart icon positioned on the right */}
      {user && (
        <TouchableOpacity
          onPress={async () => {
            if (user && onLikeToggle) {
              try {
                await AddTournamentLike(
                  user as ICAUserData,
                  tournament,
                  !isLiked,
                );
                onLikeToggle();
              } catch (error) {
                console.error('Error toggling tournament like:', error);
              }
            }
          }}
          style={{
            position: 'absolute',
            right: BasePaddingsMargins.m5, // Position from right edge
            top: BasePaddingsMargins.m5,
            padding: BasePaddingsMargins.m5,
          }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            color={isLiked ? BaseColors.danger : BaseColors.light}
            size={40} // Reduced by 20% (from 50 to 40)
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
