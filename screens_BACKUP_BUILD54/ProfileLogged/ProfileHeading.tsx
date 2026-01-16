import { Image, Text, View } from 'react-native';
import {
  BaseColors,
  BasePaddingsMargins,
  TextsSizes,
} from '../../hooks/Template';
import UIBadge from '../../components/UI/UIBadge';
import { useContextAuth } from '../../context/ContextAuth';
import { supabase } from '../../ApiSupabase/supabase';

const default_picture_source = require('./../../assets/images/default-profile-image.jpg');

export default function ProfileHeading({}) {
  const { user } = useContextAuth();

  // Function to get the correct image source
  const getImageSource = () => {
    // Use avatar1 as default if no profile image is set
    const avatarToUse =
      user?.profile_image_url && user.profile_image_url !== ''
        ? user.profile_image_url
        : 'avatar1';

    // Check if it's already a full URL (starts with http)
    if (avatarToUse.startsWith('http')) {
      return { uri: avatarToUse };
    }

    // If it's just an avatar reference like "avatar1", use the working Supabase Storage URL format
    if (avatarToUse.startsWith('avatar')) {
      const baseUrl =
        'https://ofcroxehpuiylonrakrf.supabase.co/storage/v1/object/public/images';
      const avatarUrl = `${baseUrl}/${avatarToUse}.png`;
      console.log('Using avatar URL:', avatarUrl);
      return { uri: avatarUrl };
    }

    // Fallback for any other string format - treat as URL
    return { uri: avatarToUse };
  };

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        marginBottom: BasePaddingsMargins.m30,
      }}
    >
      <Image
        source={getImageSource()}
        style={{
          width: 95, // 70 * 1.35 = 94.5, rounded to 95
          height: 95, // 70 * 1.35 = 94.5, rounded to 95
          borderRadius: 47.5, // 95 / 2 = 47.5
          marginRight: BasePaddingsMargins.m15,
        }}
        onError={() =>
          console.log('Error loading profile image, using default')
        }
      />
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        <Text
          style={{
            fontSize: TextsSizes.h2,
            color: BaseColors.title,
            marginBottom: BasePaddingsMargins.m5,
            width: '100%',
          }}
        >
          {user?.user_name
            ? user.user_name.charAt(0).toUpperCase() + user.user_name.slice(1)
            : ''}
        </Text>

        <UIBadge
          label={
            user?.id_auto !== undefined && user.id_auto !== null
              ? `PL-${user.id_auto.toString().padStart(6, '0')}`
              : 'Unknown ID'
          }
          marginBottom={BasePaddingsMargins.m5}
        />

        <Text
          style={{
            fontSize: TextsSizes.p,
            color: BaseColors.othertexts,
            width: '100%',
          }}
        >
          Member since{' '}
          {new Date(user?.created_at as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}
