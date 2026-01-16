// Optimized validation functions for CrudUser.tsx
// Build 121 - Registration Validation Fix
// Replace the existing checkUsernameAvailability and checkEmailAvailability functions with these

import { supabase } from './supabase';
import {
  validateUsername,
  validateUsernameSecurityAdvanced,
} from '../utils/ContentFilter';

/**
 * OPTIMIZED: Check if a username is available (case-insensitive)
 * Uses targeted database queries instead of fetching all profiles
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

    // Check for maximum length
    if (trimmedUsername.length > 20) {
      return {
        available: false,
        message: 'Username must be 20 characters or less',
      };
    }

    // Check for valid characters only (alphanumeric and underscore)
    const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!validUsernameRegex.test(trimmedUsername)) {
      return {
        available: false,
        message: 'Username can only contain letters, numbers, and underscores',
      };
    }

    // Use content filter for profanity check
    const contentValidation = validateUsername(trimmedUsername);
    if (!contentValidation.isValid) {
      return {
        available: false,
        message: contentValidation.message || 'Username is not valid',
      };
    }

    console.log(
      'checkUsernameAvailability: Checking username:',
      trimmedUsername,
    );

    // OPTIMIZED: Use targeted query with ILIKE for case-insensitive search
    // Only fetch what we need (just check existence)
    let query = supabase
      .from('profiles')
      .select('id, user_name', { count: 'exact', head: false })
      .ilike('user_name', trimmedUsername)
      .neq('status', 'deleted')
      .limit(10); // Limit to 10 for similarity check

    // Exclude current user if updating
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data: matches, error, count } = await query;

    console.log('checkUsernameAvailability: Query result:', {
      matchesFound: matches?.length || 0,
      error,
    });

    if (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        error,
        message: 'Error checking username availability',
      };
    }

    // If exact match found (case-insensitive), username is taken
    if (matches && matches.length > 0) {
      const exactMatch = matches.find(
        (m) => m.user_name.toLowerCase() === trimmedUsername.toLowerCase(),
      );

      if (exactMatch) {
        console.log(
          `checkUsernameAvailability: EXACT MATCH FOUND - "${exactMatch.user_name}"`,
        );
        return {
          available: false,
          message: 'Username unavailable',
        };
      }

      // Check for similarity with found usernames
      const existingUsernames = matches.map((m) => m.user_name);
      const similarityCheck = validateUsernameSecurityAdvanced(
        trimmedUsername,
        existingUsernames,
      );

      if (!similarityCheck.isValid) {
        console.log(
          `checkUsernameAvailability: SIMILARITY CONFLICT - "${trimmedUsername}"`,
        );
        return {
          available: false,
          message: 'Username unavailable',
        };
      }
    }

    console.log('checkUsernameAvailability: Username is available');
    return {
      available: true,
      message: 'Username is available',
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
 * OPTIMIZED: Check if an email is available (case-insensitive)
 * Uses targeted database queries instead of fetching all profiles
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

    // OPTIMIZED: Use targeted query with ILIKE for case-insensitive search
    // Only fetch what we need (just check existence)
    let query = supabase
      .from('profiles')
      .select('id, email', { count: 'exact', head: false })
      .ilike('email', trimmedEmail)
      .neq('status', 'deleted')
      .limit(1); // We only need to know if ANY match exists

    // Exclude current user if updating
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data: matches, error, count } = await query;

    console.log('checkEmailAvailability: Query result:', {
      matchesFound: matches?.length || 0,
      error,
    });

    if (error) {
      console.error('Error checking email availability:', error);
      return {
        available: false,
        error,
        message: 'Error checking email availability',
      };
    }

    const isAvailable = !matches || matches.length === 0;

    return {
      available: isAvailable,
      message: isAvailable ? 'Email is available' : 'Email not available',
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
