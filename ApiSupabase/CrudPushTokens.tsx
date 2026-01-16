import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PUSH_TOKEN_STORAGE_KEY = 'compete_push_token_saved';

/**
 * Save a push token to Supabase for the current user
 * @param userId The user ID to associate with the token
 * @param token The Expo push token
 * @returns Object with success status and message
 */
export const savePushToken = async (userId: string, token: string) => {
  try {
    console.log('Saving push token for user:', userId);
    console.log('Token:', token.substring(0, 10) + '...');
    console.log('Device platform:', Platform.OS);

    // Check if we've already saved this token for this user
    const { data, error } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      console.error('Error checking for existing token:', error);
      console.log('push_tokens select error', error);
      console.log('push_tokens error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      return { success: false, message: 'Failed to check for existing token' };
    }

    // If token already exists for this user, no need to save it again
    if (data && data.length > 0) {
      console.log('Token already exists for this user, updating last_seen_at');

      // Update the last_seen_at timestamp
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({
          last_seen_at: new Date().toISOString(),
          device_os: Platform.OS,
        })
        .eq('user_id', userId)
        .eq('token', token);

      if (updateError) {
        console.error('Error updating existing token:', updateError);
        return { success: false, message: 'Failed to update existing token' };
      }

      // Mark as saved in AsyncStorage
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, 'true');
      return { success: true, message: 'Token already exists and was updated' };
    }

    // Insert the new token with all required fields
    const { error: insertError } = await supabase.from('push_tokens').insert({
      user_id: userId,
      token: token,
      device_os: Platform.OS,
      device_name: `${Platform.OS} Device`,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Error saving push token:', insertError);
      console.log('push_tokens insert error details:', {
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        message: insertError.message,
      });
      return { success: false, message: 'Failed to save push token' };
    }

    // Mark as saved in AsyncStorage
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, 'true');
    return { success: true, message: 'Push token saved successfully' };
  } catch (error) {
    console.error('Unexpected error saving push token:', error);
    console.log('push_tokens unexpected error', error); // Added detailed error logging
    return { success: false, message: 'Unexpected error saving push token' };
  }
};

/**
 * Check if a push token has been saved for the current user
 * @returns Boolean indicating if a token has been saved
 */
export const hasTokenBeenSaved = async (): Promise<boolean> => {
  try {
    const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    return savedToken === 'true';
  } catch (error) {
    console.error('Error checking if token has been saved:', error);
    return false;
  }
};

/**
 * Update the notifications_enabled preference for a user
 * @param userId The user ID to update
 * @param enabled Whether notifications should be enabled
 * @returns Object with success status and message
 */
export const updateNotificationsPreference = async (
  userId: string,
  enabled: boolean,
) => {
  try {
    console.log('Updating notification preference for user:', userId);
    console.log('Enabled:', enabled);

    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled: enabled })
      .eq('id', userId);

    if (error) {
      console.error('Error updating notification preference:', error);
      console.log('profiles update error', error);
      return {
        success: false,
        message: 'Failed to update notification preference',
      };
    }

    return { success: true, message: 'Notification preference updated' };
  } catch (error) {
    console.error('Unexpected error updating notification preference:', error);
    console.log('profiles unexpected error', error);
    return {
      success: false,
      message: 'Unexpected error updating notification preference',
    };
  }
};
