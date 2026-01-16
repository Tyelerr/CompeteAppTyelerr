import {
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import { StyleThumbnailSelector, StyleZ } from '../../assets/css/styles';
import { useState } from 'react';
import {
  getMediaLibraryPermissionsAsync,
  // MediaType,
  launchCameraAsync,
  requestMediaLibraryPermissionsAsync,
  MediaType,
  launchImageLibraryAsync,
} from 'expo-image-picker';
import { UploadImage } from '../../ApiSupabase/UploadFiles';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../ApiSupabase/supabase';
import { EIGameTypes } from '../../hooks/InterfacesGlobal';
import {
  THUMBNAIL_CUSTOM,
  tournament_thumb_10_ball,
  tournament_thumb_8_ball,
  tournament_thumb_9_ball,
  tournament_thumb_bank_pool,
  tournament_thumb_one_pocket,
  tournament_thumb_straight_pool,
} from '../../hooks/constants';
import AttachImage from '../UI/Attach/AttachImage';

export interface IThumbnailObj {
  thumb: ImageSourcePropType | undefined;
  label?: string;
  value?: EIGameTypes;
}

const thumb1 = tournament_thumb_8_ball;
const thumb2 = tournament_thumb_9_ball;
const thumb3 = tournament_thumb_10_ball;
const thumb4 = tournament_thumb_one_pocket;
const thumb5 = tournament_thumb_straight_pool;
const thumb6 = tournament_thumb_bank_pool;

export default function ThumbnailSelector({
  set_thumbnail_url,
  set_thumbnailType,
  thumbnailType,
  useSubmitTournamentStyle = false,
}: {
  set_thumbnail_url: (s: string) => void;
  set_thumbnailType: (s: string) => void;
  thumbnailType: string;
  useSubmitTournamentStyle?: boolean;
}) {
  // const [selectedThumb, set_selectedThumb] = useState<EIGameTypes | null>(EIGameTypes.Ball8);
  // const [customImageURI, set_customImageURI] = useState<string>('');

  const thumbnailsReady: IThumbnailObj[] = [
    {
      thumb: thumb1,
      label: '',
      value: EIGameTypes.Ball8,
    },
    {
      thumb: thumb2,
      label: '',
      value: EIGameTypes.Ball9,
    },
    {
      thumb: thumb3,
      label: '',
      value: EIGameTypes.Ball10,
    },
    {
      thumb: thumb4,
      label: '',
      value: EIGameTypes.OnePocket,
    },
    {
      thumb: thumb5,
      label: '',
      value: EIGameTypes.StraightPool,
    },
    {
      thumb: thumb6,
      label: '',
      value: EIGameTypes.BankPool,
    },
  ];

  // Choose the appropriate thumbnail style based on the prop
  const thumbnailStyle = useSubmitTournamentStyle
    ? StyleThumbnailSelector.thumb_submitTournament
    : StyleThumbnailSelector.thumb;

  // Adjust container width based on the style being used
  const containerWidth = useSubmitTournamentStyle ? 333 : 295; // 13% increase from 295

  return (
    <View
      style={{
        marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
        width: containerWidth,
        // marginInline: 'auto'
      }}
    >
      <Text style={[StyleZ.loginFormInputLabel]}>Tournament Thumbnail</Text>
      <View
        style={[
          {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          },
        ]}
      >
        {thumbnailsReady.map((thumb: IThumbnailObj, key: number) => {
          return (
            <TouchableOpacity
              key={`thumbnail-${key}`}
              onPress={() => {
                if (thumb.value !== undefined) {
                  // set_selectedThumb(thumb.value);
                  set_thumbnailType(thumb.value);
                }
              }}
              style={[
                thumbnailStyle,
                thumb.value === thumbnailType
                  ? StyleThumbnailSelector.thumb_active
                  : null,
              ]}
            >
              <Image
                style={[StyleThumbnailSelector.image]}
                source={thumb.thumb}
              />
            </TouchableOpacity>
          );
        })}
        <AttachImage
          set_thumbnailType={set_thumbnailType}
          set_thumbnail_url={set_thumbnail_url}
        />
      </View>
    </View>
  );
}
