import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../ApiSupabase/supabase';
import {
  savePushToken,
  hasTokenBeenSaved,
} from '../ApiSupabase/CrudPushTokens';
import { registerForPushNotificationsAsync } from './registerForPushNotificationsAsync';

// Constants
const NOTIFICATION_PERMISSION_KEY = 'notification_permission_status';

/**
 * Open device settings to allow the user to enable notifications
 */
export function openNotificationSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

/**
 * Show alert to open settings when permissions are denied
 */
export function showOpenSettingsAlert() {
  Alert.alert(
    'Enable Notifications',
    'To receive notifications for your search alerts, please enable notifications in your device settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openNotificationSettings },
    ],
  );
}

/**
 * Check if notification permissions have been previously denied
 * @returns {Promise<boolean>}
 */
export async function hasPermissionBeenDenied(): Promise<boolean> {
  try {
    const status = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    return status === 'denied';
  } catch (error) {
    console.error('Error checking notification permission status:', error);
    return false;
  }
}

/**
 * Enable push notifications for the current user
 * This function handles the entire flow of requesting permissions,
 * registering the device, and saving the token to the database
 * @returns {Promise<{success: boolean, message: string, token?: string}>}
 */
export async function enableNotifications(): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  try {
    console.log('Enabling notifications - starting process');

    // Check existing permission status
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log('Current permission status:', existingStatus);

    // Always attempt to register for push notifications
    // This ensures the iOS permission prompt is shown
    console.log('Calling registerForPushNotificationsAsync...');
    const tokenResult = await registerForPushNotificationsAsync();
    console.log(
      'Token result:',
      tokenResult.ok ? 'Success' : 'Failed',
      tokenResult.ok
        ? `(Token: ${tokenResult.token.substring(0, 10)}...)`
        : `(Reason: ${tokenResult.reason})`,
    );

    if (!tokenResult.ok) {
      console.log('Failed to get push token:', tokenResult.reason);
      return {
        success: false,
        message: tokenResult.reason || 'Failed to get push token',
      };
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('User not logged in');
      return {
        success: false,
        message: 'User not logged in',
      };
    }

    console.log('Saving push token for user:', user.id);
    // Save token to database
    const result = await savePushToken(user.id, tokenResult.token);
    console.log(
      'Save token result:',
      result.success ? 'Success' : 'Failed',
      result.message,
    );

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Failed to save push token',
      };
    }

    // Get final permission status
    const { status: finalStatus } = await Notifications.getPermissionsAsync();
    console.log('Final permission status:', finalStatus);

    return {
      success: true,
      message: 'Push notifications enabled successfully',
      token: tokenResult.token,
    };
  } catch (error) {
    console.error('Error enabling notifications:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while enabling notifications',
    };
  }
}
