import { Alert } from 'react-native';
/*import { 
  ICAUserData, 
  EUserStatus, 
  // useContextAuth 
} from "../context/ContextAuth";*/

import { ICrudUserData } from './CrudUserInterface';
import { supabase } from './supabase';
import {
  ICAUserData,
  EUserStatus,
  EUserRole,
  EPermissionType,
  IPermissions,
} from '../hooks/InterfacesGlobal';

// ===== ENHANCED VALIDATION UTILITY FUNCTIONS =====

/**
 * Check if a username is available (case-insensitive) with space validation
 * @param username - The username to check
 * @param excludeUserId - Optional user ID to exclude from the check (for updates)
 * @returns Promise with availability status and error if any
 */
export const checkUsernameAvailability = async (
  username: string,
  excludeUserId?: string,
): Promise<{
  available: boolean;
  error?: any;
  message?: string;
}> => {
  try {
    if (!username || username.trim().length === 0) {
      return {
        available: false,
        message: 'Username is required',
      };
    }

    const trimmedUsername = username.trim();

    // Check for spaces in username
    if (trimmedUsername.includes(' ')) {
      return {
        available: false,
        message: 'Username cannot contain spaces',
      };
    }

    // Check for minimum length
    if (trimmedUsername.length < 3) {
      return {
        available: false,
        message: 'Username must be at least 3 characters long',
      };
    }

    console.log(
      'checkUsernameAvailability: Checking username:',
      trimmedUsername,
    );

    // Get ALL profiles and do client-side case-insensitive comparison
    // This ensures we catch all variations regardless of database storage format
    const { data: allProfiles, error } = await supabase
      .from('profiles')
      .select('id, user_name, status');

    console.log(
      'checkUsernameAvailability: Total profiles fetched:',
      allProfiles?.length,
    );

    if (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        error,
        message: 'Error checking username availability',
      };
    }

    if (!allProfiles) {
      return {
        available: true,
        message: 'Username is available',
      };
    }

    // Filter for active users (not deleted) and do case-insensitive username comparison
    const conflictingUsers = allProfiles.filter((user) => {
      // Skip deleted users
      if (user.status === 'deleted') return false;

      // Skip current user if updating
      if (excludeUserId && user.id === excludeUserId) return false;

      // Case-insensitive username comparison
      const dbUsername = (user.user_name || '').toLowerCase();
      const inputUsername = trimmedUsername.toLowerCase();

      return dbUsername === inputUsername;
    });

    console.log(
      'checkUsernameAvailability: Conflicting users found:',
      conflictingUsers,
    );
    console.log(
      'checkUsernameAvailability: Input username (lowercase):',
      trimmedUsername.toLowerCase(),
    );
    console.log(
      'checkUsernameAvailability: Database usernames (lowercase):',
      allProfiles
        .map((u) => ({
          original: u.user_name,
          lowercase: (u.user_name || '').toLowerCase(),
          status: u.status,
        }))
        .slice(0, 10),
    );

    const isAvailable = conflictingUsers.length === 0;

    return {
      available: isAvailable,
      message: isAvailable
        ? 'Username is available'
        : 'This username is already taken',
    };
  } catch (error) {
    console.error('Exception in checkUsernameAvailability:', error);
    return {
      available: false,
      error,
      message: 'Error checking username availability',
    };
  }
};

/**
 * Check if an email is available (case-insensitive) with space validation
 * @param email - The email to check
 * @param excludeUserId - Optional user ID to exclude from the check (for updates)
 * @returns Promise with availability status and error if any
 */
export const checkEmailAvailability = async (
  email: string,
  excludeUserId?: string,
): Promise<{
  available: boolean;
  error?: any;
  message?: string;
}> => {
  try {
    if (!email || email.trim().length === 0) {
      return {
        available: false,
        message: 'Email is required',
      };
    }

    const trimmedEmail = email.trim();

    // Check for spaces in email
    if (trimmedEmail.includes(' ')) {
      return {
        available: false,
        message: 'Email cannot contain spaces',
      };
    }

    const lowerEmail = trimmedEmail.toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerEmail)) {
      return {
        available: false,
        message: 'Please enter a valid email address',
      };
    }

    console.log('checkEmailAvailability: Checking email:', lowerEmail);

    // Get ALL profiles and do client-side case-insensitive comparison
    // This ensures we catch all variations regardless of database storage format
    const { data: allProfiles, error } = await supabase
      .from('profiles')
      .select('id, email, status');

    console.log(
      'checkEmailAvailability: Total profiles fetched:',
      allProfiles?.length,
    );

    if (error) {
      console.error('Error checking email availability:', error);
      return {
        available: false,
        error,
        message: 'Error checking email availability',
      };
    }

    if (!allProfiles) {
      return {
        available: true,
        message: 'Email is available',
      };
    }

    // Filter for active users (not deleted) and do case-insensitive email comparison
    const conflictingUsers = allProfiles.filter((user) => {
      // Skip deleted users
      if (user.status === 'deleted') return false;

      // Skip current user if updating
      if (excludeUserId && user.id === excludeUserId) return false;

      // Case-insensitive email comparison
      const dbEmail = (user.email || '').toLowerCase();
      const inputEmail = lowerEmail;

      return dbEmail === inputEmail;
    });

    console.log(
      'checkEmailAvailability: Conflicting users found:',
      conflictingUsers,
    );
    console.log('checkEmailAvailability: Input email (lowercase):', lowerEmail);
    console.log(
      'checkEmailAvailability: Database emails (lowercase):',
      allProfiles
        .map((u) => ({
          original: u.email,
          lowercase: (u.email || '').toLowerCase(),
          status: u.status,
        }))
        .slice(0, 10),
    );

    const isAvailable = conflictingUsers.length === 0;

    return {
      available: isAvailable,
      message: isAvailable
        ? 'Email is available'
        : 'This email address is already registered',
    };
  } catch (error) {
    console.error('Exception in checkEmailAvailability:', error);
    return {
      available: false,
      error,
      message: 'Error checking email availability',
    };
  }
};

/**
 * Validate both username and email uniqueness
 * @param username - The username to check
 * @param email - The email to check
 * @param excludeUserId - Optional user ID to exclude from the check (for updates)
 * @returns Promise with validation results
 */
export const validateUserUniqueness = async (
  username: string,
  email: string,
  excludeUserId?: string,
): Promise<{
  valid: boolean;
  usernameAvailable: boolean;
  emailAvailable: boolean;
  errors: string[];
}> => {
  try {
    const [usernameCheck, emailCheck] = await Promise.all([
      checkUsernameAvailability(username, excludeUserId),
      checkEmailAvailability(email, excludeUserId),
    ]);

    const errors: string[] = [];

    if (!usernameCheck.available && usernameCheck.message) {
      errors.push(usernameCheck.message);
    }

    if (!emailCheck.available && emailCheck.message) {
      errors.push(emailCheck.message);
    }

    return {
      valid: usernameCheck.available && emailCheck.available,
      usernameAvailable: usernameCheck.available,
      emailAvailable: emailCheck.available,
      errors,
    };
  } catch (error) {
    console.error('Exception in validateUserUniqueness:', error);
    return {
      valid: false,
      usernameAvailable: false,
      emailAvailable: false,
      errors: ['Error validating user information'],
    };
  }
};

// Export all other functions from the original file
export * from './CrudUser';
