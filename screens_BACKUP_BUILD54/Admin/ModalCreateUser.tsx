// screens/Admin/ModalCreateUser.tsx
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import { BasePaddingsMargins } from '../../hooks/Template';
import {
  EUserRole,
  UserRoles,
  ICAUserData,
} from '../../hooks/InterfacesGlobal';
import { US_STATES } from '../../hooks/constants';
import { useContextAuth } from '../../context/ContextAuth';

import {
  UpdateProfile,
  FetchProfileData,
  checkUsernameAvailability,
  checkEmailAvailability,
} from '../../ApiSupabase/CrudUser';
import { AdminCreateUser } from '../../ApiSupabase/AdminAuthHelpers';
import { validateUsername as validateUsernameContent } from '../../utils/ContentFilter';

type Props = {
  onUserCreated: (createdUser: ICAUserData) => void;
  onClose: () => void;
};

export default function ModalCreateUser({ onUserCreated, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<EUserRole>(EUserRole.BasicUser);
  const [homeState, setHomeState] = useState('');

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
  const [usernameTimer, setUsernameTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [emailTimer, setEmailTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const { user: current } = useContextAuth();
  const isAdminMode =
    current?.role === EUserRole.CompeteAdmin ||
    current?.role === EUserRole.MasterAdministrator;

  const canSubmit =
    email.trim().length > 0 &&
    userName.trim().length > 0 &&
    password.length >= 6 &&
    password.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    password === confirmPassword &&
    confirmPassword.length >= 6 &&
    homeState.trim().length > 0 &&
    usernameValidation.isAvailable !== false &&
    emailValidation.isAvailable !== false;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (usernameTimer) clearTimeout(usernameTimer);
      if (emailTimer) clearTimeout(emailTimer);
    };
  }, [usernameTimer, emailTimer]);

  // Debounced username validation
  const validateUsername = async (username: string) => {
    if (!username || username.trim().length === 0) {
      setUsernameValidation({
        isChecking: false,
        isAvailable: null,
        message: '',
      });
      return;
    }

    setUsernameValidation({
      isChecking: true,
      isAvailable: null,
      message: 'Checking availability...',
    });

    try {
      const contentValidation = validateUsernameContent(username.trim());
      if (!contentValidation.isValid) {
        setUsernameValidation({
          isChecking: false,
          isAvailable: false,
          message:
            contentValidation.message ||
            'Username contains inappropriate content',
        });
        return;
      }

      const result = await checkUsernameAvailability(username.trim());
      setUsernameValidation({
        isChecking: false,
        isAvailable: result.available,
        message: result.message || '',
      });
    } catch (error) {
      setUsernameValidation({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking username availability',
      });
    }
  };

  // Debounced email validation
  const validateEmail = async (email: string) => {
    if (!email || email.trim().length === 0) {
      setEmailValidation({ isChecking: false, isAvailable: null, message: '' });
      return;
    }

    setEmailValidation({
      isChecking: true,
      isAvailable: null,
      message: 'Checking availability...',
    });

    try {
      const result = await checkEmailAvailability(email.trim());
      setEmailValidation({
        isChecking: false,
        isAvailable: result.available,
        message: result.message || '',
      });
    } catch (error) {
      setEmailValidation({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking email availability',
      });
    }
  };

  // Handle username change with debounced validation
  const handleUsernameChange = (text: string) => {
    setUserName(text);

    if (usernameTimer) {
      clearTimeout(usernameTimer);
    }

    if (text.trim().length === 0) {
      setUsernameValidation({
        isChecking: false,
        isAvailable: null,
        message: '',
      });
      return;
    }

    const newTimer = setTimeout(() => {
      validateUsername(text);
    }, 800);

    setUsernameTimer(newTimer);
  };

  // Handle email change with debounced validation
  const handleEmailChange = (text: string) => {
    setEmail(text);

    if (emailTimer) {
      clearTimeout(emailTimer);
    }

    if (text.trim().length === 0) {
      setEmailValidation({ isChecking: false, isAvailable: null, message: '' });
      return;
    }

    const newTimer = setTimeout(() => {
      validateEmail(text);
    }, 800);

    setEmailTimer(newTimer);
  };

  async function handleSubmit() {
    if (!canSubmit || loading) {
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (homeState.trim() === '') {
      setErrorMsg('Please select your home state.');
      return;
    }
    if (usernameValidation.isAvailable === false) {
      setErrorMsg('Please choose a different username.');
      return;
    }
    if (emailValidation.isAvailable === false) {
      setErrorMsg('Please choose a different email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await AdminCreateUser(
        email.trim(),
        password,
        userName.trim(),
      );

      if (error) {
        if (error.message && error.message.includes('username')) {
          setErrorMsg(
            'This username is already taken. Please choose a different one.',
          );
        } else if (error.message && error.message.includes('email')) {
          setErrorMsg(
            'This email address is already registered. Please use a different one.',
          );
        } else {
          setErrorMsg(error.message || 'Failed to create user account.');
        }
        return;
      }

      const newUserId = data?.user?.id || null;
      if (!newUserId) {
        throw new Error('Failed to get user ID after creation');
      }

      const profileUpdates: Partial<ICAUserData> = {
        home_state: homeState.trim(),
      };

      if (isAdminMode) {
        profileUpdates.role = role;
      }

      await UpdateProfile(newUserId, profileUpdates);

      // Wait for profile data to be available
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { user: freshProfile } = await FetchProfileData(newUserId);

      // Create user object for callback
      const newUser: ICAUserData = {
        id: newUserId,
        email: email.trim(),
        user_name: userName.trim(),
        name: userName.trim(),
        role: isAdminMode ? role : EUserRole.BasicUser,
        home_state: homeState.trim(),
        home_city: '',
        created_at: new Date().toISOString(),
        created_at_formatted: new Date().toLocaleDateString(),
        id_auto: freshProfile?.id_auto || 0,
        preferred_game: '',
        skill_level: '',
        zip_code: '',
        favorite_player: '',
        favorite_game: '',
        status: null,
        profile_image_url: '',
      };

      onUserCreated(newUser);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Something went wrong while creating the user.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: '#9ca3af',
          textAlign: 'center',
          marginBottom: BasePaddingsMargins.m10,
        }}
      >
        Enter your credentials below and create the new user
      </Text>

      {/* Email Input with Validation */}
      <View style={{ marginBottom: BasePaddingsMargins.m10 }}>
        <LFInput
          label="Enter Email Address"
          placeholder="Enter your email"
          keyboardType="email-address"
          onChangeText={handleEmailChange}
          value={email}
          iconFront="mail"
          marginBottomInit={0}
        />
        {emailValidation.message && (
          <Text
            style={{
              color:
                emailValidation.isAvailable === false
                  ? '#f87171'
                  : emailValidation.isChecking
                  ? '#9ca3af'
                  : '#10b981',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            {emailValidation.message}
          </Text>
        )}
      </View>

      {/* Username Input with Validation */}
      <View style={{ marginBottom: BasePaddingsMargins.m10 }}>
        <LFInput
          label="Username"
          placeholder="Enter your username"
          onChangeText={handleUsernameChange}
          value={userName}
          iconFront="person"
          marginBottomInit={0}
        />
        {usernameValidation.message && (
          <Text
            style={{
              color:
                usernameValidation.isAvailable === false
                  ? '#f87171'
                  : usernameValidation.isChecking
                  ? '#9ca3af'
                  : '#10b981',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 4,
            }}
          >
            {usernameValidation.message}
          </Text>
        )}
      </View>

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

      <LFInput
        typeInput="dropdown"
        label="*Home State"
        placeholder="Select your home state"
        defaultValue=""
        items={US_STATES}
        onChangeText={setHomeState}
        value={homeState}
        iconFront="location"
        marginBottomInit={BasePaddingsMargins.m20}
        description="Your home state for tournament recommendations"
      />

      {isAdminMode && (
        <LFInput
          typeInput="dropdown"
          label="Assign Role"
          placeholder="Choose a role"
          defaultValue={EUserRole.BasicUser as unknown as string}
          items={UserRoles}
          onChangeText={(v: string) => setRole(v as unknown as EUserRole)}
          iconFront="shield-checkmark"
          marginBottomInit={BasePaddingsMargins.m10}
        />
      )}

      {errorMsg && (
        <Text
          style={{ color: '#f87171', marginBottom: BasePaddingsMargins.m10 }}
        >
          {errorMsg}
        </Text>
      )}

      <LFButton
        type="primary"
        label={loading ? 'Creating account...' : 'Create account'}
        disabled={!canSubmit || loading}
        onPress={handleSubmit}
      />

      <View style={{ height: BasePaddingsMargins.m10 }} />

      <LFButton type="secondary" label="Close the form" onPress={onClose} />
    </View>
  );
}
