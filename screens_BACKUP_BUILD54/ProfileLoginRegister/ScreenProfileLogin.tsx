import { Alert, Button, Text, View } from 'react-native';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import LoginFormHeading from '../../components/LoginForms/LoginFormHeading';
import { StyleZ } from '../../assets/css/styles';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LFForgotPasswordLink from '../../components/LoginForms/LFForgotPasswordLink';
import { demoCreate } from '../../ApiSupabase/CrudDemo';
import { useState } from 'react';
import { EInputValidation } from '../../components/LoginForms/Interface';
import { TheFormIsValid } from '../../hooks/Validations';
import { BasePaddingsMargins, BaseColors } from '../../hooks/Template';
import { SignIn } from '../../ApiSupabase/CrudUser';
import { ICrudUserData } from '../../ApiSupabase/CrudUserInterface';
import { useContextAuth } from '../../context/ContextAuth';
import {
  ICAUserData,
  EUserRole,
  EUserStatus,
} from '../../hooks/InterfacesGlobal';

export default function ScreenProfileLogin() {
  const { login } = useContextAuth();

  const TryToLogin = async () => {
    if (
      !TheFormIsValid([
        {
          value: email,
          validations: [EInputValidation.Required],
        },
        {
          value: password,
          validations: [EInputValidation.Password],
        },
      ])
    ) {
      setErrorForm(
        'Please enter your email address or username and password to log in.',
      );
      return;
    }

    set_loading(true);
    console.log('TryToLogin: Starting login attempt for:', email);

    const { user, data, error } = await SignIn({
      email: email,
      username: email,
      password: password,
    } as ICrudUserData);

    console.log('TryToLogin: Login result:', {
      hasUser: !!user,
      hasData: !!data,
      error: error,
    });

    if (error !== null) {
      console.log('TryToLogin: Login failed with error:', error);

      if (error === EUserStatus.StatusDeleted) {
        setErrorForm(
          'Your account has been deactivated. Please contact support.',
        );
      } else if (typeof error === 'object' && error.message) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes('invalid login credentials') ||
          errorMessage.includes('email not confirmed')
        ) {
          setErrorForm(
            'Invalid email/username or password. Please check your credentials and try again.',
          );
        } else if (errorMessage.includes('email')) {
          setErrorForm('Please check your email address and try again.');
        } else {
          setErrorForm(`Login failed: ${error.message}`);
        }
      } else if (typeof error === 'string') {
        if (error === 'Missing username or password') {
          setErrorForm('Please enter both username/email and password.');
        } else {
          setErrorForm(`Login failed: ${error}`);
        }
      } else {
        setErrorForm(
          'Login failed. Please check your credentials and try again.',
        );
      }
    } else {
      setErrorForm('');
      if (data !== null && user) {
        console.log(
          'TryToLogin: Login successful, logging in user:',
          user.user_name,
        );
        login(user);
      } else {
        console.log('TryToLogin: Login succeeded but missing user data');
        setErrorForm(
          'Login succeeded but user data is missing. Please try again.',
        );
      }
    }
    set_loading(false);
  };

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorForm, setErrorForm] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: BaseColors.backgroundColor }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: BasePaddingsMargins.m10,
          paddingTop: 100, // Fixed top padding to prevent jumping
          paddingBottom: BasePaddingsMargins.m30,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        bounces={false}
        automaticallyAdjustKeyboardInsets={false}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
      >
        <View
          style={[
            StyleZ.loginFromContainer,
            { width: '80%', alignSelf: 'center' },
          ]}
        >
          <LoginFormHeading
            title="Welcome Back!"
            subtitle="Enter your credentials below"
          />

          {errorForm !== '' ? (
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
                {errorForm}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              StyleZ.loginForm,
              {
                display: 'flex',
              },
            ]}
          >
            <LFInput
              label="Email Address or Username"
              placeholder="Enter your email or username"
              onChangeText={(text: string) => {
                setEmail(text);
                setErrorForm('');
              }}
              validations={[EInputValidation.Required]}
            />
            <LFInput
              isPassword={true}
              label="Password"
              placeholder="Enter your password"
              onChangeText={(text: string) => {
                setPassword(text);
                setErrorForm('');
              }}
              validations={[
                EInputValidation.Required,
                EInputValidation.Password,
              ]}
            />

            <View
              style={{
                marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
              }}
            >
              <LFButton
                label="Sign in"
                type="primary"
                loading={loading}
                onPress={() => {
                  TryToLogin();
                }}
              />
            </View>

            <View
              style={{
                marginTop: BasePaddingsMargins.m20,
                width: '100%',
              }}
            >
              <LFForgotPasswordLink
                label="Forgot Password?"
                route="ForgotPassword"
                enhanced={true}
                type="danger"
              />

              <LFForgotPasswordLink
                label="Need an account? Register"
                route="ScreenProfileRegister"
                enhanced={true}
                type="primary"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
