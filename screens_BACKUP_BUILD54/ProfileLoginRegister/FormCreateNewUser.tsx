// screens/ProfileLoginRegister/FormCreateNewUser.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { BasePaddingsMargins, TextsSizes } from '../../hooks/Template';
import {
  EUserRole,
  UserRoles,
  ICAUserData,
} from '../../hooks/InterfacesGlobal';
import { US_STATES } from '../../hooks/constants';
import { useContextAuth } from '../../context/ContextAuth';
import { StyleZ } from '../../assets/css/styles';

import {
  UpdateProfile,
  FetchProfileData,
  checkUsernameAvailability,
  checkEmailAvailability,
} from '../../ApiSupabase/CrudUser';
import {
  AdminCreateUser,
  FindProfileIdByEmail,
} from '../../ApiSupabase/AdminAuthHelpers';

type Props = {
  /** When used from Admin screen, this is set to "for-administrator" */
  type?: 'for-administrator' | string;
  /** Called after a successful register */
  AfterRegisteringNewUser?: (createdUser?: ICAUserData) => void;
  /** Called when the Close button is pressed */
  EventAfterCloseTheForm?: () => void;
};

export default function FormCreateNewUser(props: Props) {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<EUserRole>(EUserRole.BasicUser);
  const [homeState, setHomeState] = useState('');
  const [homeCity, setHomeCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time validation states
  const [usernameValidation, setUsernameValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({ isChecking: false, isAvailable: null, message: '' });

  const [emailValidation, setEmailValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({ isChecking: false, isAvailable: null, message: '' });

  // Debounce timers
  const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [emailTimer, setEmailTimer] = useState<NodeJS.Timeout | null>(null);

  // Only allow role assignment when used from Admin AND current user is an admin
  const { user: current, login } = useContextAuth();
  const isAdminMode =
    props.type === 'for-administrator' &&
    (current?.role === EUserRole.CompeteAdmin ||
      current?.role === EUserRole.MasterAdministrator);

  const canSubmit =
    email.trim().length > 0 &&
    userName.trim().length > 0 &&
    password.length >= 6 &&
    password.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    password === confirmPassword &&
    confirmPassword.length >= 6 &&
    homeState.trim().length > 0;

  // Debug logging
  console.log('Form validation:', {
    email: email.trim().length > 0,
    userName: userName.trim().length > 0,
    passwordLength: password.length >= 6,
    passwordNotEmpty: password.trim() !== '',
    confirmPasswordNotEmpty: confirmPassword.trim() !== '',
    passwordsMatch: password === confirmPassword,
    confirmPasswordLength: confirmPassword.length >= 6,
    homeState: homeState.trim().length > 0,
    canSubmit,
  });

  async function handleSubmit() {
    // Double-check validation to prevent any edge cases
    if (!canSubmit || loading) {
      console.log(
        'Submit blocked - canSubmit:',
        canSubmit,
        'loading:',
        loading,
      );
      return;
    }

    // Additional explicit validation
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (confirmPassword.trim() === '') {
      setErrorMsg('Please confirm your password.');
      return;
    }
    if (homeState.trim() === '') {
      setErrorMsg('Please select your home state.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      console.log(
        'Creating user with email:',
        email.trim(),
        'username:',
        userName.trim(),
      );

      // 1) Create the auth user (now uses admin API which also creates profile)
      const { data, error } = await AdminCreateUser(
        email.trim(),
        password,
        userName.trim(),
      );

      console.log('AdminCreateUser result:', {
        data: data ? 'success' : null,
        error,
      });

      if (error) {
        console.error('AdminCreateUser error:', error);
        throw error;
      }

      const newUserId = data?.user?.id || null;
      if (!newUserId) {
        throw new Error('Failed to get user ID after creation');
      }

      console.log('New user created with ID:', newUserId);

      // 2) Update profile with home state/city and role (if admin mode)
      const profileUpdates: Partial<ICAUserData> = {
        home_state: homeState.trim(),
        home_city: homeCity.trim() || '',
      };

      if (isAdminMode) {
        profileUpdates.role = role;
      }

      console.log('Updating profile with:', profileUpdates);
      const updateResult = await UpdateProfile(newUserId, profileUpdates);
      console.log('UpdateProfile result:', updateResult);

      // 3) Wait a moment for profile data to be fully available, then fetch fresh profile
      console.log('Waiting for profile data to be available...');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      // 4) Force refresh the user profile data to ensure latest data is loaded
      const { user: freshProfile, error: fetchError } = await FetchProfileData(
        newUserId,
      );
      if (fetchError) {
        console.warn('Could not fetch fresh profile data:', fetchError);
      } else {
        console.log('Fresh profile data loaded:', freshProfile);
      }

      // 5) Clear and notify parent
      setEmail('');
      setUserName('');
      setPassword('');
      setConfirmPassword('');
      setHomeState('');
      setHomeCity('');
      props.AfterRegisteringNewUser?.(freshProfile || undefined);

      console.log('User creation completed successfully');
    } catch (err: any) {
      console.error('User creation failed:', err);
      setErrorMsg(
        err?.message || 'Something went wrong while creating the user.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[StyleZ.loginForm, { marginTop: 30 }]}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={false}
      nestedScrollEnabled={false}
    >
      {/* Removed duplicate title */}
      {/* <Text
        style={{
          color: "white",
          fontSize: TextsSizes.h3,
          fontWeight: "800",
          marginBottom: BasePaddingsMargins.m10,
          textAlign: "center",
        }}
      >
        New User Form
      </Text> */}

      <Text
        style={{
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: 20,
          marginBottom: BasePaddingsMargins.m10,
        }}
      >
        Enter your credentials below and create the new user
      </Text>

      <LFInput
        label="Enter Email Address"
        placeholder="Enter your email"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
        iconFront="mail"
        marginBottomInit={BasePaddingsMargins.m10}
      />

      <LFInput
        label="Username"
        placeholder="Enter your username"
        onChangeText={setUserName}
        value={userName}
        iconFront="person"
        marginBottomInit={BasePaddingsMargins.m10}
      />

      <LFInput
        label="Password"
        placeholder="Enter your password"
        isPassword
        onChangeText={setPassword}
        value={password}
        iconFront="lock-closed"
        marginBottomInit={BasePaddingsMargins.m10}
      />

      <LFInput
        label="Confirm Password"
        placeholder="Confirm your password"
        isPassword
        onChangeText={setConfirmPassword}
        value={confirmPassword}
        iconFront="lock-closed"
        marginBottomInit={BasePaddingsMargins.m10}
      />

      {/* Home State - Required */}
      <LFInput
        typeInput="dropdown"
        label="*Home State"
        placeholder="Select your home state"
        defaultValue=""
        items={US_STATES}
        onChangeText={setHomeState}
        value={homeState}
        iconFront="location"
        marginBottomInit={BasePaddingsMargins.m10}
        description="Your home state for tournament recommendations"
      />

      {/* Home City - Optional */}
      <LFInput
        label="Home City (Optional)"
        placeholder="Enter your home city"
        onChangeText={setHomeCity}
        value={homeCity}
        iconFront="location"
        marginBottomInit={BasePaddingsMargins.m20}
        description="Your home city for more precise tournament recommendations"
      />

      {/* Role selector appears only for admins on the Admin screen */}
      {isAdminMode ? (
        <LFInput
          typeInput="dropdown"
          label="Assign Role"
          placeholder="Choose a role"
          defaultValue={EUserRole.BasicUser as unknown as string}
          items={UserRoles /* [{label, value}] */}
          onChangeText={(v: string) => setRole(v as unknown as EUserRole)}
          iconFront="shield-checkmark"
          marginBottomInit={BasePaddingsMargins.m10}
        />
      ) : null}

      {errorMsg ? (
        <Text
          style={{ color: '#f87171', marginBottom: BasePaddingsMargins.m10 }}
        >
          {errorMsg}
        </Text>
      ) : null}

      <LFButton
        type="primary"
        label={loading ? 'Creating account...' : 'Create account'}
        disabled={!canSubmit || loading}
        onPress={handleSubmit}
      />

      <View style={{ height: BasePaddingsMargins.m10 }} />

      <LFButton
        type="secondary"
        label="Close the form"
        onPress={props.EventAfterCloseTheForm}
      />
    </ScrollView>
  );
}
