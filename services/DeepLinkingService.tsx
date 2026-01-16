import * as Linking from 'expo-linking';
import { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkParams {
  token?: string;
  email?: string;
  type?: 'signup' | 'login' | 'reset-password' | 'email-verification';
  redirect?: string;
}

class DeepLinkingService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  setNavigationRef(ref: NavigationContainerRef<any>) {
    this.navigationRef = ref;
  }

  // Generate deep links for authentication flows
  generateAuthLink(
    type: 'signup' | 'login' | 'reset-password' | 'email-verification',
    params?: DeepLinkParams,
  ): string {
    const baseUrl = 'billiardsapp://auth';
    const queryParams = new URLSearchParams();

    queryParams.append('type', type);

    if (params?.token) {
      queryParams.append('token', params.token);
    }

    if (params?.email) {
      queryParams.append('email', params.email);
    }

    if (params?.redirect) {
      queryParams.append('redirect', params.redirect);
    }

    return `${baseUrl}?${queryParams.toString()}`;
  }

  // Generate web-compatible deep links
  generateWebLink(
    type: 'signup' | 'login' | 'reset-password' | 'email-verification',
    params?: DeepLinkParams,
  ): string {
    const baseUrl = 'https://billiardsapp.com/auth';
    const queryParams = new URLSearchParams();

    queryParams.append('type', type);

    if (params?.token) {
      queryParams.append('token', params.token);
    }

    if (params?.email) {
      queryParams.append('email', params.email);
    }

    if (params?.redirect) {
      queryParams.append('redirect', params.redirect);
    }

    return `${baseUrl}?${queryParams.toString()}`;
  }

  // Handle incoming deep links
  handleDeepLink(url: string): boolean {
    try {
      const parsed = Linking.parse(url);

      if (!this.navigationRef) {
        console.warn('Navigation ref not set for deep linking');
        return false;
      }

      // Handle auth-related deep links
      if (parsed.path === 'auth' && parsed.queryParams) {
        const { type, token, email, redirect } =
          parsed.queryParams as DeepLinkParams;

        switch (type) {
          case 'signup':
            this.navigationRef.navigate('ScreenProfileRegister', {
              email: email || undefined,
              redirect: redirect || undefined,
            });
            return true;

          case 'login':
            this.navigationRef.navigate('ScreenProfileLogin', {
              email: email || undefined,
              redirect: redirect || undefined,
            });
            return true;

          case 'reset-password':
            if (token) {
              this.navigationRef.navigate('ResetPassword', {
                token,
                email: email || undefined,
              });
            } else {
              this.navigationRef.navigate('ForgotPassword', {
                email: email || undefined,
              });
            }
            return true;

          case 'email-verification':
            if (token) {
              this.navigationRef.navigate('EmailVerification', {
                token,
                email: email || undefined,
              });
            }
            return true;

          default:
            console.warn('Unknown auth deep link type:', type);
            return false;
        }
      }

      // Handle other deep link patterns here
      return false;
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }

  // Initialize deep linking listeners
  initializeDeepLinking() {
    // Handle app opened from deep link when app was closed
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with initial URL:', url);
        setTimeout(() => this.handleDeepLink(url), 1000); // Delay to ensure navigation is ready
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('Deep link received:', event.url);
      this.handleDeepLink(event.url);
    });

    return subscription;
  }

  // Utility method to create email verification links
  createEmailVerificationLink(
    token: string,
    email: string,
  ): { appLink: string; webLink: string } {
    const params = { token, email };
    return {
      appLink: this.generateAuthLink('email-verification', params),
      webLink: this.generateWebLink('email-verification', params),
    };
  }

  // Utility method to create password reset links
  createPasswordResetLink(
    token: string,
    email: string,
  ): { appLink: string; webLink: string } {
    const params = { token, email };
    return {
      appLink: this.generateAuthLink('reset-password', params),
      webLink: this.generateWebLink('reset-password', params),
    };
  }

  // Utility method to create signup invitation links
  createSignupInviteLink(
    email?: string,
    redirect?: string,
  ): { appLink: string; webLink: string } {
    const params = { email, redirect };
    return {
      appLink: this.generateAuthLink('signup', params),
      webLink: this.generateWebLink('signup', params),
    };
  }
}

export default new DeepLinkingService();
