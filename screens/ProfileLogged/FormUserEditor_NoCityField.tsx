import { useEffect, useState, useCallback } from 'react';
import { EInputValidation } from '../../components/LoginForms/Interface';
import { TheFormIsValid } from '../../hooks/Validations';
import {
  FetchProfileData,
  UpdateProfile,
  UpdateUserEmail,
} from '../../ApiSupabase/CrudUser';
import { ICAUserData } from '../../hooks/InterfacesGlobal';
import { Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { StyleModal, StyleZ } from '../../assets/css/styles';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import AttachImage from '../../components/UI/Attach/AttachImage';
import LFInput from '../../components/LoginForms/LFInput';
import LFInputDropdownFixed from '../../components/LoginForms/LFInput_DropdownFixed';
import VenuesEditor from '../../components/google/VenuesEditor/VenuesEditor';
import LBButtonsGroup from '../../components/LoginForms/Button/LBButtonsGroup';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { supabase } from '../../ApiSupabase/supabase';
import ModalChooseAvatar from '../../components/Profile/ModalChooseAvatar';
import { useContextAuth } from '../../context/ContextAuth';
import { CapitalizeGameName } from '../../hooks/hooks';

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

  const performUpdate = async (emailChanged: boolean) => {
    console.log('=== performUpdate called ===');
    console.log('emailChanged:', emailChanged);

    try {
      // Apply capitalization to favorite_game before saving
      const capitalizedFavoriteGame = favorite_game
        ? CapitalizeGameName(favorite_game)
        : '';

      const NewData: any = {
        name: name,
        preferred_game: preferred_game,
        skill_level: skill_level,
        home_state: home_state,
        favorite_player: favorite_player,
        favorite_game: capitalizedFavoriteGame,
        profile_image_url: profile_image_url,
      };

      // Add email to update data if it has changed
      if (emailChanged) {
        NewData.email = email.trim();
      }

      console.log('=== NewData object being sent to UpdateProfile ===');
      console.log('Original favorite_game:', favorite_game);
      console.log('Capitalized favorite_game:', capitalizedFavoriteGame);
      console.log('NewData:', NewData);

      const updateResult = await UpdateProfile(
        userThatNeedToBeEdited.id as string,
        NewData,
      );

      console.log('=== UpdateProfile result ===');
      console.log('updateResult:', updateResult);

      if (updateResult.success) {
        // Show success message
        if (emailChanged && updateResult.requiresConfirmation) {
          setErrorForm(
            'Profile updated successfully! Please check your email to verify your new email address.',
          );
        } else if (emailChanged) {
          setErrorForm('Profile and email updated successfully!');
        } else {
          setErrorForm('Profile updated successfully!');
        }

        // Fetch updated user data
        const updatedUserData = await FetchProfileData(
          userThatNeedToBeEdited.id as string,
        );

        console.log('=== Fetched updated user data ===');
        console.log('updatedUserData:', updatedUserData);

        // Update the context with the new user data
        if (updatedUserData.user) {
          set_user(updatedUserData.user as ICAUserData);
          EventAfterUpdatingTheUser(updatedUserData.user as ICAUserData);
        }
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
      }
    } catch (error) {
      console.error('Error in performUpdate:', error);
      setErrorForm('An error occurred while updating. Please try again.');
    } finally {
      set_isLoading(false);
    }
  };

  // Use useCallback to memoize the save function and prevent re-renders
  const __SaveTheDetails = useCallback(async () => {
    console.log('=== FormUserEditor: __SaveTheDetails CALLED ===');
    console.log('Email value:', email);
    console.log('Original email:', userThatNeedToBeEdited.email);
    console.log('Name value:', name);
    console.log('Home state value:', home_state);

    set_isLoading(true);

    try {
      // Check if email has changed
      const emailChanged =
        email.trim() !== '' && email.trim() !== userThatNeedToBeEdited.email;

      console.log('=== EMAIL CHANGE CHECK ===');
      console.log('Email changed:', emailChanged);
      console.log('Current email trimmed:', email.trim());
      console.log('Original email:', userThatNeedToBeEdited.email);

      // If email changed, validate format and ask for confirmation
      if (emailChanged) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          set_isLoading(false);
          setErrorForm('Please enter a valid email address');
          return;
        }

        console.log('=== SHOWING EMAIL CONFIRMATION DIALOG ===');
        // Show confirmation dialog for email change using React Native Alert
        Alert.alert(
          'Confirm Email Change',
          `Are you sure you want to change your email from "${
            userThatNeedToBeEdited.email
          }" to "${email.trim()}"?\n\nYou will need to verify the new email address.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                console.log('Email change cancelled by user');
                set_isLoading(false);
              },
            },
            {
              text: 'Confirm',
              style: 'default',
              onPress: () => {
                console.log('Email change confirmed by user');
                // Continue with the update process
                performUpdate(true);
              },
            },
          ],
        );
        return; // Exit here, performUpdate will handle the rest
      }

      console.log('=== NO EMAIL CHANGE, PROCEEDING WITH REGULAR UPDATE ===');
      // If no email change, proceed with regular update
      await performUpdate(false);
    } catch (error) {
      console.error('Error in __SaveTheDetails:', error);
      set_isLoading(false);
      setErrorForm('An error occurred while saving. Please try again.');
    }
  }, [
    email,
    userThatNeedToBeEdited.email,
    name,
    home_state,
    preferred_game,
    skill_level,
    favorite_player,
    favorite_game,
    profile_image_url,
    userThatNeedToBeEdited.id,
  ]);

  // Expose the save function to parent - SIMPLIFIED VERSION
  useEffect(() => {
    if (onSaveFunction) {
      console.log('=== Exposing save function to parent ===');
      onSaveFunction(__SaveTheDetails, isLoading);
    }
  }, [onSaveFunction, __SaveTheDetails, isLoading]);

  useEffect(() => {
    console.log('=== INITIALIZING FORM DATA ===');
    console.log('userThatNeedToBeEdited:', userThatNeedToBeEdited);
    console.log(
      'userThatNeedToBeEdited.home_state:',
      userThatNeedToBeEdited.home_state,
    );

    set_email(userThatNeedToBeEdited.email as string);
    set_username(userThatNeedToBeEdited.user_name as string);
    set_name(userThatNeedToBeEdited.name as string);
    set_preferred_game(userThatNeedToBeEdited.preferred_game as string);
    set_skill_level(userThatNeedToBeEdited.skill_level as string);

    // Ensure home_state is properly set - add more debugging
    const currentHomeState = userThatNeedToBeEdited.home_state || '';
    console.log('Raw home_state from user:', userThatNeedToBeEdited.home_state);
    console.log('Processed currentHomeState:', currentHomeState);
    console.log('Type of currentHomeState:', typeof currentHomeState);

    // Force the state to be set properly
    if (currentHomeState && currentHomeState.trim() !== '') {
      console.log('Setting home_state to non-empty value:', currentHomeState);
      set_home_state(currentHomeState.trim());
    } else {
      console.log('Setting home_state to empty string');
      set_home_state('');
    }

    set_favorite_player(userThatNeedToBeEdited.favorite_player as string);
    set_favorite_game(userThatNeedToBeEdited.favorite_game as string);
    set_profile_image_url(userThatNeedToBeEdited.profile_image_url as string);
  }, [userThatNeedToBeEdited]);

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

          <LFInput
            keyboardType="email-address"
            label="Email Address"
            placeholder="Enter your email address"
            defaultValue={userThatNeedToBeEdited.email}
            value={email}
            description="Your email address for account access and notifications"
            onChangeText={(text: string) => {
              set_email(text);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
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

          <LFInputDropdownFixed
            keyboardType="default"
            label="Home State"
            placeholder={home_state ? '' : 'Select your home state'}
            defaultValue={userThatNeedToBeEdited.home_state || ''}
            value={home_state}
            capitalizeTheWords={true}
            description="Your home state for tournament recommendations"
            onChangeText={(text: string) => {
              console.log('=== Home State onChangeText called ===');
              console.log('Received text:', text);
              console.log('Text type:', typeof text);

              const stateValue = String(text || '');
              console.log('Converted stateValue:', stateValue);

              // Find the matching state in our items array to verify
              const matchingState = [
                { label: 'Alabama', value: 'AL' },
                { label: 'Alaska', value: 'AK' },
                { label: 'Arizona', value: 'AZ' },
                { label: 'Arkansas', value: 'AR' },
                { label: 'California', value: 'CA' },
                { label: 'Colorado', value: 'CO' },
                { label: 'Connecticut', value: 'CT' },
                { label: 'Delaware', value: 'DE' },
                { label: 'Florida', value: 'FL' },
                { label: 'Georgia', value: 'GA' },
                { label: 'Hawaii', value: 'HI' },
                { label: 'Idaho', value: 'ID' },
                { label: 'Illinois', value: 'IL' },
                { label: 'Indiana', value: 'IN' },
                { label: 'Iowa', value: 'IA' },
                { label: 'Kansas', value: 'KS' },
                { label: 'Kentucky', value: 'KY' },
                { label: 'Louisiana', value: 'LA' },
                { label: 'Maine', value: 'ME' },
                { label: 'Maryland', value: 'MD' },
                { label: 'Massachusetts', value: 'MA' },
                { label: 'Michigan', value: 'MI' },
                { label: 'Minnesota', value: 'MN' },
                { label: 'Mississippi', value: 'MS' },
                { label: 'Missouri', value: 'MO' },
                { label: 'Montana', value: 'MT' },
                { label: 'Nebraska', value: 'NE' },
                { label: 'Nevada', value: 'NV' },
                { label: 'New Hampshire', value: 'NH' },
                { label: 'New Jersey', value: 'NJ' },
                { label: 'New Mexico', value: 'NM' },
                { label: 'New York', value: 'NY' },
                { label: 'North Carolina', value: 'NC' },
                { label: 'North Dakota', value: 'ND' },
                { label: 'Ohio', value: 'OH' },
                { label: 'Oklahoma', value: 'OK' },
                { label: 'Oregon', value: 'OR' },
                { label: 'Pennsylvania', value: 'PA' },
                { label: 'Rhode Island', value: 'RI' },
                { label: 'South Carolina', value: 'SC' },
                { label: 'South Dakota', value: 'SD' },
                { label: 'Tennessee', value: 'TN' },
                { label: 'Texas', value: 'TX' },
                { label: 'Utah', value: 'UT' },
                { label: 'Vermont', value: 'VT' },
                { label: 'Virginia', value: 'VA' },
                { label: 'Washington', value: 'WA' },
                { label: 'West Virginia', value: 'WV' },
                { label: 'Wisconsin', value: 'WI' },
                { label: 'Wyoming', value: 'WY' },
              ].find((item) => item.value === stateValue);

              console.log('Matching state found:', matchingState);

              set_home_state(stateValue);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
            typeInput="dropdown"
            items={[
              { label: 'Alabama', value: 'AL' },
              { label: 'Alaska', value: 'AK' },
              { label: 'Arizona', value: 'AZ' },
              { label: 'Arkansas', value: 'AR' },
              { label: 'California', value: 'CA' },
              { label: 'Colorado', value: 'CO' },
              { label: 'Connecticut', value: 'CT' },
              { label: 'Delaware', value: 'DE' },
              { label: 'Florida', value: 'FL' },
              { label: 'Georgia', value: 'GA' },
              { label: 'Hawaii', value: 'HI' },
              { label: 'Idaho', value: 'ID' },
              { label: 'Illinois', value: 'IL' },
              { label: 'Indiana', value: 'IN' },
              { label: 'Iowa', value: 'IA' },
              { label: 'Kansas', value: 'KS' },
              { label: 'Kentucky', value: 'KY' },
              { label: 'Louisiana', value: 'LA' },
              { label: 'Maine', value: 'ME' },
              { label: 'Maryland', value: 'MD' },
              { label: 'Massachusetts', value: 'MA' },
              { label: 'Michigan', value: 'MI' },
              { label: 'Minnesota', value: 'MN' },
              { label: 'Mississippi', value: 'MS' },
              { label: 'Missouri', value: 'MO' },
              { label: 'Montana', value: 'MT' },
              { label: 'Nebraska', value: 'NE' },
              { label: 'Nevada', value: 'NV' },
              { label: 'New Hampshire', value: 'NH' },
              { label: 'New Jersey', value: 'NJ' },
              { label: 'New Mexico', value: 'NM' },
              { label: 'New York', value: 'NY' },
              { label: 'North Carolina', value: 'NC' },
              { label: 'North Dakota', value: 'ND' },
              { label: 'Ohio', value: 'OH' },
              { label: 'Oklahoma', value: 'OK' },
              { label: 'Oregon', value: 'OR' },
              { label: 'Pennsylvania', value: 'PA' },
              { label: 'Rhode Island', value: 'RI' },
              { label: 'South Carolina', value: 'SC' },
              { label: 'South Dakota', value: 'SD' },
              { label: 'Tennessee', value: 'TN' },
              { label: 'Texas', value: 'TX' },
              { label: 'Utah', value: 'UT' },
              { label: 'Vermont', value: 'VT' },
              { label: 'Virginia', value: 'VA' },
              { label: 'Washington', value: 'WA' },
              { label: 'West Virginia', value: 'WV' },
              { label: 'Wisconsin', value: 'WI' },
              { label: 'Wyoming', value: 'WY' },
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
            capitalizeGameName={true}
            defaultValue={userThatNeedToBeEdited.favorite_game}
            value={favorite_game}
            onChangeText={(text: string) => {
              // Apply capitalization immediately when user types
              const capitalizedText = text ? CapitalizeGameName(text) : '';
              set_favorite_game(capitalizedText);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
          />
        </View>
      </View>
    </>
  );
}
