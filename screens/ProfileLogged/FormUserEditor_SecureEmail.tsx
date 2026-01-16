import { useEffect, useState } from 'react';
import { EInputValidation } from '../../components/LoginForms/Interface';
import { TheFormIsValid } from '../../hooks/Validations';
import { FetchProfileData, UpdateProfile } from '../../ApiSupabase/CrudUser';
import { callUpdateUserEmail } from '../../ApiSupabase/EdgeFunctionService';
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
import ModalUpdatePassword from './ModalUpdatePassword';
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
  const { set_user } = useContextAuth();

  const __SaveTheDetails = async () => {
    console.log('=== FormUserEditor: __SaveTheDetails CALLED ===');
    console.log('Email value:', email);
    console.log('Original email:', userThatNeedToBeEdited.email);

    // Check if email has changed
    const emailChanged =
      email.trim() !== '' && email.trim() !== userThatNeedToBeEdited.email;

    console.log('=== EMAIL CHANGE CHECK ===');
    console.log('Email changed:', emailChanged);

    // If email changed, use the secure Edge Function
    if (emailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorForm('Please enter a valid email address');
        return;
      }

      // Check if password is provided
      if (!currentPassword || currentPassword.trim() === '') {
        setErrorForm('Please enter your current password to change your email');
        return;
      }

      console.log('=== SHOWING EMAIL CONFIRMATION DIALOG ===');

      // Return a promise that resolves when user makes a choice
      return new Promise<void>((resolve) => {
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
                resolve();
              },
            },
            {
              text: 'Confirm',
              style: 'default',
              onPress: async () => {
                console.log('Email change confirmed by user');
                set_isLoading(true);
                await performEmailUpdate();
                resolve();
              },
            },
          ],
        );
      });
    }

    console.log('=== NO EMAIL CHANGE, PROCEEDING WITH REGULAR UPDATE ===');
    set_isLoading(true);
    await performProfileUpdate();
  };

  const performEmailUpdate = async () => {
    console.log('=== performEmailUpdate called ===');

    try {
      // Call the secure Edge Function
      const result = await callUpdateUserEmail(email.trim(), currentPassword);

      console.log('=== Edge Function Response ===');
      console.log('result:', JSON.stringify(result, null, 2));
      console.log('result.success:', result.success);
      console.log('result.status:', result.status);
      console.log('result.error:', result.error);

      // Check for explicit success
      if (result.success === true || result.status === 'ok') {
        console.log('Email update succeeded');

        // Clear password field
        setCurrentPassword('');

        // Fetch updated user data from database
        const updatedUserData = await FetchProfileData(
          userThatNeedToBeEdited.id as string,
        );

        if (updatedUserData.user) {
          set_user(updatedUserData.user as ICAUserData);

          // IMPORTANT: Reset the email field to show the CURRENT database value
          // Until the user verifies the new email, the database still has the old email
          set_email(updatedUserData.user.email as string);

          // Now update other profile fields if any changed
          // This will show the unified success alert
          await performProfileUpdate(true);
        }
      } else {
        // Email update failed
        set_isLoading(false);
        const errorMsg =
          result.error || result.message || 'Failed to update email';
        console.error('Email update failed:', errorMsg);

        // Show error alert instead of just setting error form
        Alert.alert(
          'Email Update Failed',
          errorMsg.includes('password') || errorMsg.includes('Invalid')
            ? "Invalid password. Please make sure you're using your current password."
            : errorMsg,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('User acknowledged email update failure');
              },
            },
          ],
        );
        setErrorForm(errorMsg);
      }
    } catch (error) {
      set_isLoading(false);
      console.error('Email update exception:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update email. Please try again.';

      Alert.alert('Error', errorMessage, [
        {
          text: 'OK',
          onPress: () => {
            console.log('User acknowledged email update error');
          },
        },
      ]);
      setErrorForm(errorMessage);
    }
  };

  const performProfileUpdate = async (emailWasUpdated: boolean = false) => {
    console.log('=== performProfileUpdate called ===');
    console.log('emailWasUpdated:', emailWasUpdated);

    const NewData: any = {
      name: name,
      preferred_game: preferred_game,
      skill_level: skill_level,
      home_city: home_city,
      home_state: home_state,
      favorite_player: favorite_player,
      favorite_game: favorite_game,
      profile_image_url: profile_image_url,
    };

    // DO NOT include email in regular profile updates
    // Email is handled separately via Edge Function

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
      // Fetch updated user data
      const updatedUserData = await FetchProfileData(
        userThatNeedToBeEdited.id as string,
      );

      console.log('=== Fetched updated user data ===');
      console.log('updatedUserData:', updatedUserData);

      if (updatedUserData.user) {
        set_user(updatedUserData.user as ICAUserData);

        // Show unified success alert for all updates (email + profile or just profile)
        const successMessage = emailWasUpdated
          ? 'Profile has been updated. Please check your new email to verify the change.'
          : 'Profile has been updated.';

        Alert.alert('Success', successMessage, [
          {
            text: 'OK',
            onPress: () => {
              console.log('User acknowledged profile update');
              EventAfterUpdatingTheUser(updatedUserData.user as ICAUserData);
            },
          },
        ]);
      }
    } else {
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
  };

  const [errorFormMessagem, setErrorForm] = useState<string>('');
  const [email, set_email] = useState<string>('');
  const [username, set_username] = useState<string>('');
  const [name, set_name] = useState<string>('');
  const [preferred_game, set_preferred_game] = useState<string>('');
  const [skill_level, set_skill_level] = useState<string>('');
  const [home_city, set_home_city] = useState<string>('');
  const [home_state, set_home_state] = useState<string>('');
  const [favorite_player, set_favorite_player] = useState<string>('');
  const [favorite_game, set_favorite_game] = useState<string>('');
  const [profile_image_url, set_profile_image_url] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [modalChooseAvatarIsOpened, set_modalChooseAvatarIsOpened] =
    useState<boolean>(false);
  const [modalUpdatePasswordIsOpened, set_modalUpdatePasswordIsOpened] =
    useState<boolean>(false);
  const [modalUpdateEmailIsOpened, set_modalUpdateEmailIsOpened] =
    useState<boolean>(false);

  // Available cities for dropdown (fetched based on selected state)
  const [availableCities, setAvailableCities] = useState<
    { label: string; value: string }[]
  >([]);

  // Check if email has changed to show/hide password field
  const emailHasChanged =
    email.trim() !== '' && email.trim() !== userThatNeedToBeEdited.email;

  // Fetch cities when home state changes
  const fetchCitiesForState = async (selectedState: string) => {
    if (!selectedState) {
      setAvailableCities([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('venues')
        .select('city')
        .eq('state', selectedState)
        .not('city', 'is', null)
        .not('city', 'eq', '');

      if (error) {
        console.error('Error fetching cities:', error);
        return;
      }

      const uniqueCities = Array.from(
        new Set(data.map((item: any) => item.city)),
      ).sort();

      const cityOptions = uniqueCities.map((city: string) => ({
        label: city,
        value: city,
      }));

      setAvailableCities(cityOptions);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const getImageSource = () => {
    if (profile_image_url && profile_image_url !== '') {
      if (profile_image_url.startsWith('http')) {
        return { uri: profile_image_url };
      }

      if (profile_image_url.startsWith('avatar')) {
        const baseUrl =
          'https://ofcroxehpuiylonrakrf.supabase.co/storage/v1/object/public/images';
        const avatarUrl = `${baseUrl}/${profile_image_url}.png`;
        return { uri: avatarUrl };
      }

      return { uri: profile_image_url };
    }

    return require('../../assets/images/default-profile-image.jpg');
  };

  const handleSelectAvatar = (avatarUri: string) => {
    console.log('Avatar selected in FormUserEditor:', avatarUri);
    set_profile_image_url(avatarUri);
    set_modalChooseAvatarIsOpened(false);
  };

  // Only update the save function reference when loading state changes
  // This prevents stale closures and excessive re-renders
  useEffect(() => {
    if (onSaveFunction) {
      console.log('=== FormUserEditor: Updating save function reference ===');
      console.log('isLoading:', isLoading);
      onSaveFunction(__SaveTheDetails, isLoading);
    }
  }, [onSaveFunction, isLoading]);

  useEffect(() => {
    console.log('=== INITIALIZING FORM DATA ===');
    console.log('userThatNeedToBeEdited:', userThatNeedToBeEdited);

    set_email(userThatNeedToBeEdited.email as string);
    set_username(userThatNeedToBeEdited.user_name as string);
    set_name(userThatNeedToBeEdited.name as string);
    set_preferred_game(userThatNeedToBeEdited.preferred_game as string);
    set_skill_level(userThatNeedToBeEdited.skill_level as string);
    set_home_city(userThatNeedToBeEdited.home_city || '');
    set_home_state(userThatNeedToBeEdited.home_state || '');
    set_favorite_player(userThatNeedToBeEdited.favorite_player as string);
    set_favorite_game(userThatNeedToBeEdited.favorite_game as string);
    set_profile_image_url(userThatNeedToBeEdited.profile_image_url as string);

    if (userThatNeedToBeEdited.home_state) {
      fetchCitiesForState(userThatNeedToBeEdited.home_state);
    }
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

          {/* Update Password Button */}
          <View
            style={{ marginBottom: BasePaddingsMargins.formInputMarginLess }}
          >
            <TouchableOpacity
              onPress={() => set_modalUpdatePasswordIsOpened(true)}
              style={{
                padding: 12,
                backgroundColor: BaseColors.secondary,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 16,
                }}
              >
                🔒 Update Password
              </Text>
            </TouchableOpacity>
          </View>

          <ModalUpdatePassword
            isOpened={modalUpdatePasswordIsOpened}
            onClose={() => set_modalUpdatePasswordIsOpened(false)}
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
            label="Home City"
            placeholder="Select your home city"
            defaultValue={userThatNeedToBeEdited.home_city || ''}
            value={home_city}
            capitalizeTheWords={true}
            description="Your home city for location-based filtering"
            onChangeText={(text: string) => {
              set_home_city(text);
              setErrorForm('');
            }}
            disableAccessoryBar={true}
            typeInput="dropdown"
            items={availableCities}
          />

          <LFInput
            keyboardType="default"
            label="Home State"
            placeholder="Select your home state"
            defaultValue={home_state || userThatNeedToBeEdited.home_state || ''}
            capitalizeTheWords={true}
            description="Your home state for tournament recommendations"
            onChangeText={(text: string) => {
              const stateValue = String(text || '');
              set_home_state(stateValue);
              setErrorForm('');
              fetchCitiesForState(stateValue);
              set_home_city('');
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
