import { useEffect, useState, useCallback } from 'react';
import { EInputValidation } from '../../components/LoginForms/Interface';
import { TheFormIsValid } from '../../hooks/Validations';
import { FetchProfileData, UpdateProfile } from '../../ApiSupabase/CrudUser';
import { ICAUserData } from '../../hooks/InterfacesGlobal';
import { Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import AttachImage from '../../components/UI/Attach/AttachImage';
import LFInput from '../../components/LoginForms/LFInput';
import VenuesEditor from '../../components/google/VenuesEditor/VenuesEditor';
import LBButtonsGroup from '../../components/LoginForms/Button/LBButtonsGroup';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { supabase } from '../../ApiSupabase/supabase';
import ModalChooseAvatar from '../../components/Profile/ModalChooseAvatar';
import ModalUpdateEmail from './ModalUpdateEmail';
import { useContextAuth } from '../../context/ContextAuth';

export default function FormUserEditor({
  userThatNeedToBeEdited,
  EventAfterUpdatingTheUser,
  EventAfterCancelUpdating,
  onSaveFunction,
}: {
  userThatNeedToBeEdited: ICAUserData;
  EventAfterUpdatingTheUser: (user: ICAUserData) => void;
  EventAfterCancelUpdating: () => void;
  onSaveFunction?: (saveFunc: () => Promise<void>, isLoading: boolean) => void;
}) {
  const [isLoading, set_isLoading] = useState<boolean>(false);
  const [modalUpdateEmailIsOpened, set_modalUpdateEmailIsOpened] =
    useState<boolean>(false);
  const { set_user } = useContextAuth();

  const [errorFormMessagem, setErrorForm] = useState<string>('');
  const [email, set_email] = useState<string>('');
  const [username, set_username] = useState<string>('');
  const [name, set_name] = useState<string>('');
  const [preferred_game, set_preferred_game] = useState<string>('');
  const [skill_level, set_skill_level] = useState<string>('');
  const [home_state, set_home_state] = useState<string>('');
  const [favorite_player, set_favorite_player] = useState<string>('');
  const [favorite_game, set_favorite_game] = useState<string>('');
  const [profile_image_url, set_profile_image_url] = useState<string>('');
  const [modalChooseAvatarIsOpened, set_modalChooseAvatarIsOpened] =
    useState<boolean>(false);

  const __SaveTheDetails = useCallback(async () => {
    console.log('=== FormUserEditor: __SaveTheDetails CALLED ===');
    console.log('Name value:', name);
    console.log('Home state value:', home_state);
    console.log('Favorite player value:', favorite_player);
    console.log('Favorite game value:', favorite_game);

    set_isLoading(true);

    // Regular profile update (email is handled separately via ModalUpdateEmail)
    console.log('=== Regular profile update ===');

    const NewData: any = {
      name: name,
      preferred_game: preferred_game,
      skill_level: skill_level,
      home_state: home_state,
      favorite_player: favorite_player,
      favorite_game: favorite_game,
      profile_image_url: profile_image_url,
    };

    console.log('=== NewData object being sent to UpdateProfile ===');
    console.log('NewData:', NewData);

    const updateResult = await UpdateProfile(
      userThatNeedToBeEdited.id as string,
      NewData,
    );

    set_isLoading(false);

    console.log('=== UpdateProfile result ===');
    console.log('updateResult:', updateResult);

    if (updateResult.success) {
      setErrorForm('Profile updated successfully!');

      // Show success alert
      Alert.alert('Success', 'Profile updated successfully!');

      // CRITICAL FIX: Don't fetch and update user data here - it causes re-render and state reset
      // Instead, just close the modal and let the parent handle the refresh
      EventAfterUpdatingTheUser(userThatNeedToBeEdited);
    } else {
      // Handle error
      console.log('UpdateProfile failed:', updateResult.error);
      const errorMessage =
        updateResult.error &&
        typeof updateResult.error === 'object' &&
        'message' in updateResult.error
          ? updateResult.error.message
          : typeof updateResult.error === 'string'
          ? updateResult.error
          : 'Failed to update profile';
      setErrorForm(errorMessage);

      // Show error alert
      Alert.alert('Error', errorMessage);
    }
  }, [
    name,
    preferred_game,
    skill_level,
    home_state,
    favorite_player,
    favorite_game,
    profile_image_url,
    userThatNeedToBeEdited,
    EventAfterUpdatingTheUser,
    setErrorForm,
  ]);

  // Function to get the correct image source for avatar display
  const getImageSource = () => {
    if (profile_image_url && profile_image_url !== '') {
      // Check if it's already a full URL (starts with http)
      if (profile_image_url.startsWith('http')) {
        return { uri: profile_image_url };
      }

      // If it's just an avatar reference like "avatar1", use the working Supabase Storage URL format
      if (profile_image_url.startsWith('avatar')) {
        const baseUrl =
          'https://ofcroxehpuiylonrakrf.supabase.co/storage/v1/object/public/images';
        const avatarUrl = `${baseUrl}/${profile_image_url}.png`;
        return { uri: avatarUrl };
      }

      // Fallback for any other string format - treat as URL
      return { uri: profile_image_url };
    }

    // Default image
    return require('../../assets/images/default-profile-image.jpg');
  };

  const handleSelectAvatar = (avatarUri: string) => {
    console.log('Avatar selected in FormUserEditor:', avatarUri);
    set_profile_image_url(avatarUri);
    set_modalChooseAvatarIsOpened(false);
  };

  // Expose the save function and loading state to parent
  useEffect(() => {
    if (onSaveFunction) {
      onSaveFunction(__SaveTheDetails, isLoading);
    }
  }, [onSaveFunction, isLoading, __SaveTheDetails]);

  // CRITICAL FIX: Only initialize ONCE when component mounts, not every time userThatNeedToBeEdited changes
  // This prevents resetting user's edits when the user object updates
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      console.log('=== INITIALIZING FORM DATA (ONCE) ===');
      console.log('userThatNeedToBeEdited:', userThatNeedToBeEdited);

      set_email(userThatNeedToBeEdited.email as string);
      set_username(userThatNeedToBeEdited.user_name as string);
      set_name(userThatNeedToBeEdited.name as string);
      set_preferred_game(userThatNeedToBeEdited.preferred_game as string);
      set_skill_level(userThatNeedToBeEdited.skill_level as string);
      set_home_state(userThatNeedToBeEdited.home_state || '');
      set_favorite_player(userThatNeedToBeEdited.favorite_player as string);
      set_favorite_game(userThatNeedToBeEdited.favorite_game as string);
      set_profile_image_url(userThatNeedToBeEdited.profile_image_url as string);

      setIsInitialized(true);
    }
  }, [userThatNeedToBeEdited, isInitialized]);

  return (
    <>
      {errorFormMessagem !== '' ? (
        <View
          style={{
            justifyContent: 'center',
            marginBottom: BasePaddingsMargins.sectionMarginBottom,
          }}
        >
          <Text
            style={[
              StyleZ.LFErrorMessage,
              StyleZ.LFErrorMessage_addon_centered,
            ]}
          >
            {errorFormMessagem}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          StyleZ.loginFromContainer,
          {
            minHeight: 0,
          },
        ]}
      >
        <View style={StyleZ.loginForm}>
          <View
            style={[
              {
                marginBottom: BasePaddingsMargins.formInputMarginLess,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => set_modalChooseAvatarIsOpened(true)}
              style={{
                marginBottom: BasePaddingsMargins.formInputMarginLess,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={getImageSource()}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 2,
                  borderColor: BaseColors.primary,
                }}
              />
              <Text
                style={{
                  color: BaseColors.primary,
                  marginTop: 5,
                  fontWeight: 'bold',
                }}
              >
                Choose Avatar
              </Text>
            </TouchableOpacity>
            <ModalChooseAvatar
              visible={modalChooseAvatarIsOpened}
              onClose={() => set_modalChooseAvatarIsOpened(false)}
              onSelectAvatar={handleSelectAvatar}
            />
          </View>

          <View
            style={{ marginBottom: BasePaddingsMargins.formInputMarginLess }}
          >
            <Text style={[StyleZ.loginFormInputLabel]}>Username</Text>
            <View
              style={{
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#ddd',
              }}
            >
              <Text style={{ color: '#888', fontSize: 16 }}>
                {userThatNeedToBeEdited.user_name}
              </Text>
            </View>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
              Username cannot be changed
            </Text>
          </View>

          {/* Email Address - Read-only with Update Button */}
          <View
            style={{ marginBottom: BasePaddingsMargins.formInputMarginLess }}
          >
            <Text style={[StyleZ.loginFormInputLabel]}>Email Address</Text>
            <View
              style={{
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#ddd',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#666', fontSize: 16 }}>
                {userThatNeedToBeEdited.email}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => set_modalUpdateEmailIsOpened(true)}
              style={{
                backgroundColor: BaseColors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                Update Email Address
              </Text>
            </TouchableOpacity>
          </View>

          <ModalUpdateEmail
            visible={modalUpdateEmailIsOpened}
            onClose={() => set_modalUpdateEmailIsOpened(false)}
            currentEmail={userThatNeedToBeEdited.email as string}
            userId={userThatNeedToBeEdited.id as string}
          />

          <LFInput
            keyboardType="default"
            label="Name (Optional)"
            placeholder="Cesar Morales (As shown in Fargo Rate)"
            defaultValue={userThatNeedToBeEdited.name}
            value={name}
            capitalizeTheWords={true}
            onChangeText={(text: string) => {
              set_name(text);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
          />

          <LFInput
            keyboardType="default"
            label="Home State"
            placeholder="Select your home state"
            defaultValue={home_state || userThatNeedToBeEdited.home_state || ''}
            value={home_state}
            capitalizeTheWords={true}
            description="Your home state for tournament recommendations"
            onChangeText={(text: string) => {
              console.log('=== Home State onChangeText called ===');
              console.log('Received text:', text);
              console.log('Text type:', typeof text);

              const stateValue = String(text || '');
              console.log('Converted stateValue:', stateValue);

              set_home_state(stateValue);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
            typeInput="dropdown"
            items={[
              { label: 'AL', value: 'AL' },
              { label: 'AK', value: 'AK' },
              { label: 'AZ', value: 'AZ' },
              { label: 'AR', value: 'AR' },
              { label: 'CA', value: 'CA' },
              { label: 'CO', value: 'CO' },
              { label: 'CT', value: 'CT' },
              { label: 'DE', value: 'DE' },
              { label: 'FL', value: 'FL' },
              { label: 'GA', value: 'GA' },
              { label: 'HI', value: 'HI' },
              { label: 'ID', value: 'ID' },
              { label: 'IL', value: 'IL' },
              { label: 'IN', value: 'IN' },
              { label: 'IA', value: 'IA' },
              { label: 'KS', value: 'KS' },
              { label: 'KY', value: 'KY' },
              { label: 'LA', value: 'LA' },
              { label: 'ME', value: 'ME' },
              { label: 'MD', value: 'MD' },
              { label: 'MA', value: 'MA' },
              { label: 'MI', value: 'MI' },
              { label: 'MN', value: 'MN' },
              { label: 'MS', value: 'MS' },
              { label: 'MO', value: 'MO' },
              { label: 'MT', value: 'MT' },
              { label: 'NE', value: 'NE' },
              { label: 'NV', value: 'NV' },
              { label: 'NH', value: 'NH' },
              { label: 'NJ', value: 'NJ' },
              { label: 'NM', value: 'NM' },
              { label: 'NY', value: 'NY' },
              { label: 'NC', value: 'NC' },
              { label: 'ND', value: 'ND' },
              { label: 'OH', value: 'OH' },
              { label: 'OK', value: 'OK' },
              { label: 'OR', value: 'OR' },
              { label: 'PA', value: 'PA' },
              { label: 'RI', value: 'RI' },
              { label: 'SC', value: 'SC' },
              { label: 'SD', value: 'SD' },
              { label: 'TN', value: 'TN' },
              { label: 'TX', value: 'TX' },
              { label: 'UT', value: 'UT' },
              { label: 'VT', value: 'VT' },
              { label: 'VA', value: 'VA' },
              { label: 'WA', value: 'WA' },
              { label: 'WV', value: 'WV' },
              { label: 'WI', value: 'WI' },
              { label: 'WY', value: 'WY' },
            ]}
          />

          <LFInput
            keyboardType="default"
            label="Favorite Player (Optional)"
            placeholder="Enter your favorite player"
            capitalizeTheWords={true}
            defaultValue={userThatNeedToBeEdited.favorite_player}
            value={favorite_player}
            description="Your pool hero or role model"
            onChangeText={(text: string) => {
              set_favorite_player(text);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
          />

          <LFInput
            keyboardType="default"
            label="Favorite Game (Optional)"
            placeholder="Enter your favorite game"
            capitalizeTheWords={true}
            defaultValue={userThatNeedToBeEdited.favorite_game}
            value={favorite_game}
            onChangeText={(text: string) => {
              set_favorite_game(text);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
          />
        </View>
      </View>
    </>
  );
}
