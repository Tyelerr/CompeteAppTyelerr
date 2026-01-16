// examples/DeepLinkingExamples.tsx
// Example implementations showing how to use the deep linking service with Supabase auth

import { supabase } from '../ApiSupabase/supabase';
import DeepLinkingService from '../services/DeepLinkingService';

/**
 * Example: Email Verification with Deep Links
 */
export const handleEmailVerification = async (
  email: string,
  password: string,
) => {
  try {
    // Sign up user with email verification
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This will be the base URL for email verification
        emailRedirectTo:
          'https://billiardsapp.com/auth?type=email-verification',
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }

    // Generate deep links for the verification email
    if (data.user && !data.user.email_confirmed_at) {
      const { appLink, webLink } =
        DeepLinkingService.createEmailVerificationLink(
          'verification-token', // This would come from Supabase
          email,
        );

      console.log('Email verification links generated:');
      console.log('App link:', appLink);
      console.log('Web link:', webLink);

      return {
        success: true,
        message: 'Please check your email for verification link',
        links: { appLink, webLink },
      };
    }

    return { success: true, message: 'Account created successfully' };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: 'Failed to create account' };
  }
};

/**
 * Example: Password Reset with Deep Links
 */
export const handlePasswordReset = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://billiardsapp.com/auth?type=reset-password',
    });

    if (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }

    // Generate deep links for the password reset email
    const { appLink, webLink } = DeepLinkingService.createPasswordResetLink(
      'reset-token', // This would come from Supabase
      email,
    );

    console.log('Password reset links generated:');
    console.log('App link:', appLink);
    console.log('Web link:', webLink);

    return {
      success: true,
      message: 'Password reset email sent',
      links: { appLink, webLink },
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to send reset email' };
  }
};

/**
 * Example: Signup Invitation with Deep Links
 */
export const createSignupInvitation = (
  invitedEmail: string,
  inviterName: string,
) => {
  // Generate signup invitation links
  const { appLink, webLink } = DeepLinkingService.createSignupInviteLink(
    invitedEmail,
    'dashboard', // Redirect to dashboard after successful signup
  );

  // Example email template data
  const emailTemplate = {
    to: invitedEmail,
    subject: `${inviterName} invited you to join Billiards App`,
    html: `
      <h2>You're Invited!</h2>
      <p>${inviterName} has invited you to join Billiards App.</p>
      <p>Click the link below to create your account:</p>
      <a href="${webLink}" style="
        background-color: #2662d9;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 8px;
        display: inline-block;
        margin: 16px 0;
      ">Join Billiards App</a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${webLink}</p>
    `,
    // For mobile users, include the app link
    appLink: appLink,
  };

  console.log('Signup invitation created:', emailTemplate);
  return emailTemplate;
};

/**
 * Example: Handle Deep Link in Login Screen
 */
export const handleLoginDeepLink = (params: any) => {
  const { email, redirect } = params;

  // Pre-fill email if provided
  if (email) {
    console.log('Pre-filling email from deep link:', email);
    // Set email in your login form state
  }

  // Store redirect destination for after login
  if (redirect) {
    console.log('Will redirect to after login:', redirect);
    // Store in AsyncStorage or state management
  }
};

/**
 * Example: Handle Deep Link in Registration Screen
 */
export const handleRegistrationDeepLink = (params: any) => {
  const { email, redirect } = params;

  // Pre-fill email if provided
  if (email) {
    console.log('Pre-filling email from deep link:', email);
    // Set email in your registration form state
  }

  // Store redirect destination for after registration
  if (redirect) {
    console.log('Will redirect to after registration:', redirect);
    // Store in AsyncStorage or state management
  }
};

/**
 * Example: Process Email Verification Token
 */
export const processEmailVerificationToken = async (
  token: string,
  email: string,
) => {
  try {
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('Email verification failed:', error);
      return {
        success: false,
        error: 'Invalid or expired verification link',
      };
    }

    console.log('Email verified successfully:', data);
    return {
      success: true,
      message: 'Email verified successfully! You can now log in.',
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      error: 'Failed to verify email',
    };
  }
};

/**
 * Example: Process Password Reset Token
 */
export const processPasswordResetToken = async (
  token: string,
  newPassword: string,
) => {
  try {
    // Update password with the reset token
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password reset failed:', error);
      return {
        success: false,
        error: 'Invalid or expired reset link',
      };
    }

    console.log('Password reset successfully:', data);
    return {
      success: true,
      message: 'Password updated successfully!',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Failed to reset password',
    };
  }
};

/**
 * Example: Test Deep Link Generation
 */
export const testDeepLinkGeneration = () => {
  console.log('=== Testing Deep Link Generation ===');

  // Test email verification link
  const emailVerification = DeepLinkingService.createEmailVerificationLink(
    'test-verification-token',
    'test@example.com',
  );
  console.log('Email Verification Links:', emailVerification);

  // Test password reset link
  const passwordReset = DeepLinkingService.createPasswordResetLink(
    'test-reset-token',
    'test@example.com',
  );
  console.log('Password Reset Links:', passwordReset);

  // Test signup invitation link
  const signupInvite = DeepLinkingService.createSignupInviteLink(
    'invited@example.com',
    'dashboard',
  );
  console.log('Signup Invitation Links:', signupInvite);

  console.log('=== Deep Link Generation Test Complete ===');
};

/**
 * Example: Integration with React Native Components
 */
export const DeepLinkButton = ({
  type,
  email,
}: {
  type: string;
  email: string;
}) => {
  const handlePress = () => {
    let link = '';

    switch (type) {
      case 'login':
        link = DeepLinkingService.generateAuthLink('login', { email });
        break;
      case 'signup':
        link = DeepLinkingService.generateAuthLink('signup', { email });
        break;
      default:
        console.warn('Unknown deep link type:', type);
        return;
    }

    console.log('Generated deep link:', link);
    // You could use Linking.openURL(link) to test the link
  };

  return {
    onPress: handlePress,
    title: `Test ${type} Deep Link`,
  };
};
