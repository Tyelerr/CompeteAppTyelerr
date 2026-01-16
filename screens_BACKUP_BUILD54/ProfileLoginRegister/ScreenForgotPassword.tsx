import { Text, View } from 'react-native';
import ScreenScrollView from '../ScreenScrollView';
import LoginFormHeading from '../../components/LoginForms/LoginFormHeading';
import { StyleZ } from '../../assets/css/styles';
import LFInput from '../../components/LoginForms/LFInput';
import LFButton from '../../components/LoginForms/Button/LFButton';
import LFForgotPasswordLink from '../../components/LoginForms/LFForgotPasswordLink';
import { useState } from 'react';
import { EInputValidation } from '../../components/LoginForms/Interface';
import { TheFormIsValid } from '../../hooks/Validations';
import { BasePaddingsMargins } from '../../hooks/Template';
import { ResetPassword } from '../../ApiSupabase/CrudUser';

export default function ScreenForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [errorForm, setErrorForm] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleResetPassword = async () => {
    if (
      !TheFormIsValid([
        {
          value: email,
          validations: [EInputValidation.Required, EInputValidation.Email],
        },
      ])
    ) {
      setErrorForm('Please enter a valid email address.');
      setSuccessMessage('');
      return;
    }

    setLoading(true);
    setErrorForm('');
    setSuccessMessage('');

    console.log('ScreenForgotPassword: Starting password reset for:', email);

    const { success, error, message } = await ResetPassword(email);

    if (success) {
      console.log('ScreenForgotPassword: Password reset successful');
      setSuccessMessage(message || 'Password reset email sent successfully.');
      setErrorForm('');
      setEmail(''); // Clear the email field on success
    } else {
      console.log('ScreenForgotPassword: Password reset failed:', error);
      if (typeof error === 'object' && error.message) {
        setErrorForm(error.message);
      } else if (typeof error === 'string') {
        setErrorForm(error);
      } else {
        setErrorForm(
          message || 'Failed to send password reset email. Please try again.',
        );
      }
      setSuccessMessage('');
    }

    setLoading(false);
  };

  return (
    <ScreenScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      keyboardVerticalOffsetIOS={80}
    >
      <View style={[StyleZ.loginFromContainer, { width: '80%' }]}>
        <LoginFormHeading
          title="Reset Password"
          subtitle="Enter your email address to receive a password reset link"
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

        {successMessage !== '' ? (
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
                { color: '#4CAF50' }, // Green color for success message
              ]}
            >
              {successMessage}
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
            label="Email Address"
            placeholder="Enter your email address"
            onChangeText={(text: string) => {
              setEmail(text);
              setErrorForm('');
              setSuccessMessage('');
            }}
            value={email}
            validations={[EInputValidation.Required, EInputValidation.Email]}
            keyboardType="email-address"
          />

          <View
            style={{
              marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
            }}
          >
            <LFButton
              label="Send Reset Link"
              type="primary"
              loading={loading}
              onPress={handleResetPassword}
            />
          </View>

          <LFForgotPasswordLink
            label="Back to Login"
            route="ScreenProfileLogin"
          />
        </View>
      </View>
    </ScreenScrollView>
  );
}
