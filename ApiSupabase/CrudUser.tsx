import { Alert } from 'react-native';
/*import { 
  ICAUserData, 
  EUserStatus, 
  // useContextAuth 
} from "../context/ContextAuth";*/

import { ICrudUserData } from './CrudUserInterface';
import {
  supabase,
  isSupabaseInitialized,
  getSupabaseInitError,
} from './supabase';
import { callUpdateUserEmail } from './EdgeFunctionService';
import {
  ICAUserData,
  EUserStatus,
  EUserRole,
  EPermissionType,
  IPermissions,
} from '../hooks/InterfacesGlobal';
import {
  validateUsername,
  validateUsernameSecurityAdvanced,
  normalizeUsername,
} from '../utils/ContentFilter';

// ===== VALIDATION UTILITY FUNCTIONS =====

/**
 * Check if a username is available (case-insensitive)
 * Uses a secure database function that can be called by anonymous users
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

    // Call the secure database function that bypasses RLS
    const { data, error } = await supabase.rpc('check_username_available', {
      username_to_check: trimmedUsername,
    });

    console.log('checkUsernameAvailability: RPC result:', {
      available: data,
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

    const isAvailable = data === true;

    return {
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username unavailable',
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
 * Check if an email is available (case-insensitive)
 * Uses a secure database function that can be called by anonymous users
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

    // Call the secure database function that bypasses RLS
    const { data, error } = await supabase.rpc('check_email_available', {
      email_to_check: trimmedEmail,
    });

    console.log('checkEmailAvailability: RPC result:', {
      available: data,
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

    const isAvailable = data === true;

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

export const FetchProfileData = async (userId: string) => {
  try {
    console.log('FetchProfileData: Looking for user ID:', userId);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('FetchProfileData: Query result:', {
      found: !!data,
      error: error,
      userId: userId,
    });

    if (error) {
      console.error('FetchProfileData: Error fetching profile:', error);

      // If single() fails, try to find by email as fallback
      console.log('FetchProfileData: Trying email fallback...');

      // Get the email from auth user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.email) {
        console.log('FetchProfileData: Searching by email:', authUser.email);

        const { data: profileByEmail, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        console.log('FetchProfileData: Email search result:', {
          found: !!profileByEmail,
          error: emailError,
          email: authUser.email,
        });

        if (profileByEmail && !emailError) {
          return {
            user: profileByEmail as ICAUserData,
            error: null,
          };
        }
      }
    }

    if (data) {
      return {
        user: data as ICAUserData,
        error: null,
      };
    } else {
      return { user: null, error };
    }
  } catch (error) {
    console.error('FetchProfileData: Exception:', error);
    return { user: null, error };
  }
};

export const FetchUsers = async (
  loggedUser: ICAUserData,
  s?: string,
  userRole?: EUserRole,
  searchIdNumber?: string,
  includeDeleted?: boolean,
) => {
  // const {user} = useContextAuth();
  const search: string = s === undefined ? '' : s;
  const userRoleQuery: string = userRole === undefined ? '' : userRole;

  try {
    let query = supabase.from('profiles').select('*'); // starting with base query;
    query.not('id', 'eq', loggedUser.id);
    // .not('role', 'eq', 'AAA')
    if (!includeDeleted) {
      query.not('status', 'eq', EUserStatus.StatusDeleted);
    }
    if (search !== '') {
      query.or(
        `user_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }
    if (searchIdNumber !== '') {
      // // // // // console.log(`Searching users by searchIdNumber: ${searchIdNumber}`);
      // query.or(`id_auto33::text.ilike.%${searchIdNumber}%`);
    }
    if (userRoleQuery !== '') {
      query.eq('role', userRoleQuery);
    }
    query.limit(10).order('created_at', { ascending: false });
    const { data, error } = await query;
    // // // // // // // // // console.log('error:', error);
    return { data, error };
  } catch (error) {
    return { users: [], error };
  }
};

export const FetchUsersV2 = async (
  loggedUser: ICAUserData,
  s?: string,
  userRole?: EUserRole,
  searchIdNumber?: string,
  includeDeleted?: boolean,
) => {
  // const {user} = useContextAuth();
  const search: string = s === undefined ? '' : s;
  const userRoleQuery: string = userRole === undefined ? '' : userRole;

  try {
    let query = supabase.from('profiles').select('*');
    query.not('id', 'eq', loggedUser.id);

    // Filter by status - show active users and users with null status (legacy)
    const shouldIncludeDeleted =
      includeDeleted ||
      loggedUser.role === EUserRole.MasterAdministrator ||
      loggedUser.role === EUserRole.CompeteAdmin;

    if (!shouldIncludeDeleted) {
      // Show only active users OR users with null status (legacy users)
      query.or('status.is.null,status.eq.active');
    }
    if (search !== '') {
      query.or(
        `user_name.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }
    if (userRoleQuery !== '') {
      query.eq('role', userRoleQuery);
    }
    if (searchIdNumber !== '' && !isNaN(Number(searchIdNumber))) {
      // Add any filtering by searchIdNumber if needed here
    }
    const { data: users, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error || !users) {
      return { data: users, error };
    }

    // Enhance users with venue counts and tournament director counts
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        let venues_count = 0;
        let tournament_directors_count = 0;

        try {
          if (user.role === EUserRole.BarAdmin) {
            // Count venues where user is the bar owner
            const { count, error: venueError } = await supabase
              .from('venues')
              .select('*', { count: 'exact', head: true })
              .eq('barowner_id', user.id_auto);

            if (!venueError && count !== null) {
              venues_count = count;
            }

            // Count unique tournament directors assigned to this bar owner's venues
            const { data: tdData, error: tdError } = await supabase
              .from('venues')
              .select('td_id')
              .eq('barowner_id', user.id_auto)
              .not('td_id', 'is', null);

            if (!tdError && tdData) {
              // Get unique tournament director IDs
              const uniqueTdIds = [
                ...new Set(
                  tdData
                    .map((venue) => venue.td_id)
                    .filter((id) => id !== null),
                ),
              ];
              tournament_directors_count = uniqueTdIds.length;
            }
          } else if (user.role === EUserRole.TournamentDirector) {
            // Count venues where user is the tournament director
            const { count, error: venueError } = await supabase
              .from('venues')
              .select('*', { count: 'exact', head: true })
              .eq('td_id', user.id_auto);

            if (!venueError && count !== null) {
              venues_count = count;
            }
          }
        } catch (venueError) {
          console.error(
            'Error fetching venue/TD count for user:',
            user.id_auto,
            venueError,
          );
          // Continue with venues_count = 0, tournament_directors_count = 0
        }

        return {
          ...user,
          venues_count,
          tournament_directors_count,
        };
      }),
    );

    return { data: enhancedUsers, error: null };
  } catch (error) {
    return { users: [], error };
  }
};

export const SignUp = async (
  newUser: ICrudUserData,
  type?: 'sign-up' | 'create-user',
) => {
  try {
    console.log('SignUp: Starting user registration process');
    console.log('SignUp: Username:', newUser.username);
    console.log('SignUp: Email:', newUser.email);

    // Check if Supabase is properly initialized
    if (!isSupabaseInitialized()) {
      const errorMessage = getSupabaseInitError();
      console.error('SignUp: Supabase not initialized:', errorMessage);
      return {
        data: null,
        error: 'initialization-error',
        message: errorMessage,
      };
    }

    // Additional safety check for auth object
    if (!supabase || !supabase.auth) {
      console.error('SignUp: Supabase auth object is undefined');
      return {
        data: null,
        error: 'auth-undefined',
        message:
          'Authentication service is not available. Please restart the app.',
      };
    }

    // Comprehensive validation using new validation functions
    const validation = await validateUserUniqueness(
      newUser.username,
      newUser.email,
    );

    if (!validation.valid) {
      console.log('SignUp: Validation failed:', validation.errors);

      // Return specific error types for better handling
      if (!validation.usernameAvailable && !validation.emailAvailable) {
        return {
          data: null,
          error: 'both-exist',
          message: validation.errors.join(' '),
          details: {
            usernameAvailable: validation.usernameAvailable,
            emailAvailable: validation.emailAvailable,
            errors: validation.errors,
          },
        };
      } else if (!validation.usernameAvailable) {
        return {
          data: null,
          error: 'username-exist',
          message:
            validation.errors.find((e) => e.includes('username')) ||
            'Username already taken',
          details: {
            usernameAvailable: validation.usernameAvailable,
            emailAvailable: validation.emailAvailable,
            errors: validation.errors,
          },
        };
      } else if (!validation.emailAvailable) {
        return {
          data: null,
          error: 'email-exist',
          message:
            validation.errors.find((e) => e.includes('email')) ||
            'Email not available',
          details: {
            usernameAvailable: validation.usernameAvailable,
            emailAvailable: validation.emailAvailable,
            errors: validation.errors,
          },
        };
      }
    }

    console.log('SignUp: Validation passed, proceeding with user creation');

    // Note: Admin user creation (type === 'create-user') should be handled via Edge Functions
    // For now, we only support regular signup
    if (type === 'create-user') {
      console.error(
        'SignUp: Admin user creation must be done via Edge Functions',
      );
      return {
        data: null,
        error: 'admin-creation-not-supported',
        message:
          'Admin user creation must be done via Edge Functions for security',
      };
    }

    console.log('SignUp: Creating user via regular signup');
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
    });

    if (error) {
      console.error('SignUp: Regular signup failed:', error);
      throw error;
    }

    console.log('SignUp: User authentication created successfully');

    if (data.user) {
      console.log('SignUp: Creating user profile');
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        user_name: newUser.username,
        name: '',
        preferred_game: '',
        skill_level: '',
        zip_code: '',
        home_city: '',
        home_state: '',
        favorite_player: '',
        favorite_game: '',
        role: EUserRole.BasicUser,
        status: EUserStatus.StatusActive,
        profile_image_url: '',
      });

      if (profileError) {
        console.error('SignUp: Profile creation failed:', profileError);
        // Note: Cleanup would require admin API, which should be done via Edge Function
        console.error(
          'SignUp: Unable to cleanup auth user - requires Edge Function',
        );
        throw profileError;
      }

      console.log('SignUp: Profile created successfully, fetching user data');
      const { user, error } = await FetchProfileData(data.user.id);

      if (error) {
        console.error('SignUp: Failed to fetch profile data:', error);
      }

      console.log('SignUp: User registration completed successfully');
      return { user, data, error: null };
    }

    console.log('SignUp: No user data returned from authentication');
    return { user: null, error: 'No user data returned' };
  } catch (error: any) {
    console.error('SignUp: Exception occurred:', error);

    // Handle specific error types
    if (error.message) {
      if (
        error.message.includes('username') ||
        error.message.includes('user_name')
      ) {
        return {
          data: null,
          error: 'username-exist',
          message: 'Username already taken',
        };
      }
      if (error.message.includes('email')) {
        return {
          data: null,
          error: 'email-exist',
          message: 'Email not available',
        };
      }
      if (
        error.message.includes('duplicate key') ||
        error.message.includes('unique constraint')
      ) {
        return {
          data: null,
          error: 'duplicate-data',
          message: 'Username or email not available',
        };
      }
    }

    return {
      data: null,
      error: error,
      message: error.message || 'An error occurred during registration',
    };
  }
};

// OPTIMIZED SIGNIN FUNCTION - Fixes both login and performance issues
// FIXED: Properly handles username login with email normalization
export const SignIn = async (userSignIn: ICrudUserData) => {
  const email = userSignIn.email;
  const username = userSignIn.username;
  const password = userSignIn.password;

  // Input validation
  if (!username || !password) {
    console.log('SignIn: Missing username or password');
    return { data: null, error: 'Missing username or password' };
  }

  let emailToUse: string = '';

  try {
    console.log('SignIn: Starting login process');
    console.log('SignIn: Input username/email:', username);

    // Trim and normalize the input
    const trimmedInput = username.trim();

    // Check if input looks like an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailFormat = emailRegex.test(trimmedInput);

    if (isEmailFormat) {
      // Input is already an email, use it directly (lowercase for consistency)
      emailToUse = trimmedInput.toLowerCase();
      console.log('SignIn: Input is email format, using:', emailToUse);
    } else {
      // Input is a username, look it up with optimized query
      console.log('SignIn: Input is username format, looking up email...');

      const { data: userProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('email, user_name, status, id')
        .ilike('user_name', trimmedInput)
        .or('status.is.null,status.eq.active')
        .limit(1)
        .maybeSingle();

      console.log('SignIn: Username lookup result:', {
        found: !!userProfile,
        username: trimmedInput,
        foundUsername: userProfile?.user_name || null,
        foundEmail: userProfile?.email || null,
        status: userProfile?.status || null,
        error: fetchError?.message || null,
      });

      if (fetchError) {
        console.error('SignIn: Error during username lookup:', fetchError);
        // Don't fail here, try to use input as email as fallback
        emailToUse = trimmedInput.toLowerCase();
        console.log('SignIn: Using input as email fallback:', emailToUse);
      } else if (userProfile && userProfile.email) {
        // User found by username, use their email for authentication
        // CRITICAL FIX: Ensure email is trimmed and lowercased
        emailToUse = userProfile.email.trim().toLowerCase();
        console.log('SignIn: Found user by username, using email:', emailToUse);
        console.log('SignIn: User status:', userProfile.status || 'null');
      } else {
        // No user found by username, treat input as email
        emailToUse = trimmedInput.toLowerCase();
        console.log(
          'SignIn: No user found by username, treating as email:',
          emailToUse,
        );
      }
    }

    // Validate we have an email to use
    if (!emailToUse || emailToUse.length === 0) {
      console.error('SignIn: No email determined for authentication');
      return {
        data: null,
        error: 'Unable to determine email for authentication',
      };
    }

    // Attempt authentication with Supabase
    console.log('SignIn: Attempting authentication with email:', emailToUse);
    console.log('SignIn: Password length:', password.length);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });

    console.log('SignIn: Authentication result:', {
      success: !!data?.user,
      userId: data?.user?.id || null,
      error: error?.message || null,
      errorCode: error?.status || null,
    });

    if (error) {
      console.error('SignIn: Authentication failed:', error.message);
      return { data: null, error };
    }

    if (!data?.user) {
      console.error('SignIn: Authentication succeeded but no user data');
      return { data: null, error: 'No user data returned from authentication' };
    }

    // Fetch user profile data
    console.log('SignIn: Fetching profile data for user:', data.user.id);
    const { user: userProfile, error: profileError } = await FetchProfileData(
      data.user.id,
    );

    if (profileError) {
      console.error('SignIn: Error fetching profile:', profileError);
      return { data: null, error: profileError };
    }

    // Check if user is deleted
    if (userProfile && userProfile.status === EUserStatus.StatusDeleted) {
      console.log('SignIn: User account is deleted');
      return { error: EUserStatus.StatusDeleted, data: null, user: null };
    }

    console.log('SignIn: Login successful for user:', userProfile?.user_name);
    return { user: userProfile, data: data.user, error: null };
  } catch (error: any) {
    console.error('SignIn: Exception occurred:', error);
    return { data: null, error, user: null };
  }
};

export const GetSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    // // // // // // // // // // // console.log('session:', session)
    // // // // // // // // // // // console.log('error:', error)
    if (error) {
      throw error;
    } else if (session) {
      const userProfileData = await FetchProfileData(session.user.id);
      return { user: userProfileData.user, error: null, case_: '1' };
    } else {
      return { user: null, error: null, case_: '3' };
    }
  } catch (error) {
    return { user: null, error, case_: '4' };
  }
  /*finally{
    return { user: null, error: null, case_:'5' }
  }*/
};

export const UpdateProfile = async (
  userId: string,
  dataForUpdate: Partial<ICAUserData>,
) => {
  try {
    console.log('=== UpdateProfile called ===');
    console.log('userId:', userId);
    console.log('dataForUpdate:', dataForUpdate);
    console.log('dataForUpdate.home_city:', dataForUpdate.home_city);
    console.log('dataForUpdate.home_state:', dataForUpdate.home_state);

    // SECURITY NOTE: Email updates are now handled by the Edge Function
    // This function should NOT receive email in dataForUpdate
    // Email changes must go through callUpdateUserEmail() in EdgeFunctionService
    if (dataForUpdate.email) {
      console.warn(
        'WARNING: Email update attempted via UpdateProfile - this is not secure!',
      );
      console.warn(
        'Email updates must use the Edge Function: callUpdateUserEmail()',
      );
      return {
        success: false,
        error: 'Email updates must be done through the secure Edge Function',
        requiresConfirmation: false,
      };
    }

    console.log('=== About to update profile in database ===');
    console.log('Update payload:', dataForUpdate);

    // Update the profile data using regular supabase client with RLS
    const { data, error } = await supabase
      .from('profiles')
      .update(dataForUpdate)
      .eq('id', userId)
      .select();

    console.log('=== Database update result ===');
    console.log('data:', data);
    console.log('error:', error);

    if (error) {
      console.error('UpdateProfile database error:', error);
      return { success: false, error, requiresConfirmation: false };
    }

    if (data && data.length > 0) {
      console.log('=== UpdateProfile success ===');
      console.log('Updated profile data:', data[0]);
      console.log('Updated home_city:', data[0].home_city);
      console.log('Updated home_state:', data[0].home_state);

      return {
        success: true,
        error: null,
        requiresConfirmation: false,
        message: 'Profile updated successfully.',
      };
    }

    console.log('UpdateProfile: No data returned');
    return {
      success: false,
      error: 'No data returned',
      requiresConfirmation: false,
    };
  } catch (error) {
    console.error('UpdateProfile exception:', error);
    return { success: false, error, requiresConfirmation: false };
  }
};

/**
 * Update user email in both authentication and profile
 * This function handles the complete email update process
 */
export const UpdateUserEmail = async (userId: string, newEmail: string) => {
  try {
    console.log('UpdateUserEmail called with:', { userId, newEmail });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return {
        success: false,
        error: 'Invalid email format',
        requiresConfirmation: false,
      };
    }

    // Update authentication email
    const { data: authData, error: authError } = await supabase.auth.updateUser(
      {
        email: newEmail,
      },
    );

    if (authError) {
      console.error('Failed to update authentication email:', authError);
      return { success: false, error: authError, requiresConfirmation: false };
    }

    // Update profile email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error('Failed to update profile email:', profileError);
      return {
        success: false,
        error: profileError,
        requiresConfirmation: false,
      };
    }

    console.log('Email update successful:', { authData, profileData });

    return {
      success: true,
      error: null,
      requiresConfirmation: true,
      message:
        'Email updated successfully. Please check your email to confirm the new email address.',
      authData,
      profileData,
    };
  } catch (error) {
    console.error('UpdateUserEmail exception:', error);
    return { success: false, error, requiresConfirmation: false };
  }
};

export const DeleteUser = async (userForDeleting: ICAUserData) => {
  try {
    // If the user is a Tournament Director, clear their assignment from all venues
    if (
      userForDeleting.role === EUserRole.TournamentDirector &&
      userForDeleting.id_auto
    ) {
      console.log(
        'DeleteUser: Clearing TD assignment from venues for user:',
        userForDeleting.id_auto,
      );

      const { error: venueError } = await supabase
        .from('venues')
        .update({ td_id: null, tournament_director_id: null })
        .eq('td_id', userForDeleting.id_auto);

      if (venueError) {
        console.error('DeleteUser: Error clearing TD from venues:', venueError);
      } else {
        console.log(
          'DeleteUser: Successfully cleared TD assignment from venues',
        );
      }
    }

    // Mark user as deleted in profile
    // Note: Actual auth user deletion requires admin API and should be done via Edge Function
    await UpdateProfile(userForDeleting.id, {
      status: EUserStatus.StatusDeleted,
    });

    console.log('DeleteUser: User marked as deleted in profile');
  } catch (error) {
    console.error('DeleteUser: Error occurred:', error);
  }
};

export const FetchMyDirectors = async (
  my_user_id: number,
  filter_search?: string,
) => {
  /*const {
    data, error
  } = await supabase
    .from('permissions')
    .select('*')
    .eq('id_user_give_permission', my_user_id)
    .eq('permission_type', EPermissionType.AccessToBarVenues)
    ;*/

  const { data, error } = await supabase
    // .rpc('get_analytics_counts', { userid: user.id });
    .rpc('fetch_directors_by_filters_v3', {
      filter_search: filter_search !== undefined ? filter_search : '',
      user_id_that_give_permission: my_user_id,
    });
  let IidsMyDirectors: number[] = [0];
  const PermissionsForDirectors: IPermissions[] = data as IPermissions[];
  for (let i = 0; i < PermissionsForDirectors.length; i++) {
    IidsMyDirectors.push(PermissionsForDirectors[i].id_user_need_permission);
  }

  const { data: dataDirectors, error: errorDirectors } = await supabase
    .from('profiles')
    .select('*')
    .in('id_auto', IidsMyDirectors);

  return {
    data: dataDirectors,
    error: errorDirectors,
  };
};

export const FetchPotentialDirectors = async (
  my_user_id: number,
  filter_search?: string,
) => {
  const { data: _myDirectors_, error: myDirectorsError } =
    await FetchMyDirectors(my_user_id);
  const myDirectors: ICAUserData[] = _myDirectors_ as ICAUserData[];
  let myDirectorsIds = [0];
  for (let i = 0; i < myDirectors.length; i++) {
    myDirectorsIds.push(myDirectors[i].id_auto);
  }

  const {
    data: dataFilteredPotentialDirectors,
    error: errorFilteredPotentialDirectors,
  } = await supabase
    // .rpc('get_analytics_counts', { userid: user.id });
    .rpc('fetch_potential_directors_v1', {
      filter_search: filter_search !== undefined ? filter_search : '',
      user_id_that_give_permission: my_user_id,
      exclude_user_ids: myDirectorsIds,
    });
  const IdsForSelecting: number[] = [];
  for (let i = 0; i < dataFilteredPotentialDirectors.length; i++) {
    IdsForSelecting.push(dataFilteredPotentialDirectors[i].id_auto);
  }

  const { data: dataPotentialDirectors, error: dataPotentialDirectorsError } =
    await supabase
      .from('profiles')
      .select('*')
      // .neq('id_auto', my_user_id)
      // .not('id_auto', 'in', `(${myDirectorsIds.join(',')})`)
      .in('id_auto', IdsForSelecting)
      .limit(30);
  return {
    dataPotentialDirectors,
    dataPotentialDirectorsError,
  };
};

export const AddDirectorToMyVenues = async (
  id_user_need_permission: number,
  id_user_give_permission: number,
) => {
  const { data, error } = await supabase.from('permissions').upsert({
    id_user_need_permission: id_user_need_permission,
    id_user_give_permission: id_user_give_permission,
    permission_type: EPermissionType.AccessToBarVenues,
  });

  // return {  }
  return { data, error };
};

export const RemoveDirector = async (myId: number, hisId: number) => {
  const { data, error } = await supabase
    .from('permissions')
    .delete()
    .eq('id_user_need_permission', hisId)
    .eq('id_user_give_permission', myId)
    .eq('permission_type', EPermissionType.AccessToBarVenues);

  return { data, error };
};

/**
 * Reset password for a user by email
 * Sends a password reset email using Supabase's built-in functionality
 */
export const ResetPassword = async (
  email: string,
): Promise<{
  success: boolean;
  error?: any;
  message?: string;
}> => {
  try {
    console.log('ResetPassword: Starting password reset for email:', email);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://thecompeteapp.com/reset-password',
    });

    if (error) {
      console.error('ResetPassword: Failed to send reset email:', error);
      return {
        success: false,
        error,
        message: 'Failed to send password reset email. Please try again.',
      };
    }

    console.log('ResetPassword: Password reset email sent successfully');
    return {
      success: true,
      error: null,
      message:
        'Password reset email sent successfully. Please check your email.',
    };
  } catch (error) {
    console.error('ResetPassword: Unexpected error:', error);
    return {
      success: false,
      error,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};
