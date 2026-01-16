import { Alert } from 'react-native';
/*import { 
  ICAUserData, 
  EUserStatus, 
  // useContextAuth 
} from "../context/ContextAuth";*/

import { ICrudUserData } from './CrudUserInterface';
import { supabase, supabaseAdmin } from './supabase_safe';
import {
  ICAUserData,
  EUserStatus,
  EUserRole,
  EPermissionType,
  IPermissions,
} from '../hooks/InterfacesGlobal';
import { validateUsername } from '../utils/ContentFilter';

// ===== VALIDATION UTILITY FUNCTIONS =====

/**
 * Check if a username is available (case-insensitive)
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

    // Check for confusing character combinations that could be used for impersonation
    const confusingPatterns = [
      /[Il1]/g, // Contains I, l, or 1 which can look similar
      /[O0]/g, // Contains O or 0 which can look similar
      /__+/g, // Multiple consecutive underscores
      /^_/, // Starts with underscore
      /_$/, // Ends with underscore
    ];

    // Check for potentially confusing characters
    if (
      confusingPatterns[0].test(trimmedUsername) ||
      confusingPatterns[1].test(trimmedUsername)
    ) {
      return {
        available: false,
        message:
          'Username cannot contain characters that may be confusing (I, l, 1, O, 0)',
      };
    }

    // Check for multiple consecutive underscores
    if (confusingPatterns[2].test(trimmedUsername)) {
      return {
        available: false,
        message: 'Username cannot contain multiple consecutive underscores',
      };
    }

    // Check for starting or ending with underscore
    if (
      confusingPatterns[3].test(trimmedUsername) ||
      confusingPatterns[4].test(trimmedUsername)
    ) {
      return {
        available: false,
        message: 'Username cannot start or end with an underscore',
      };
    }

    // Use the comprehensive content filter for additional validation
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

    // Use the same simple pattern that works for tournaments
    // First try: Get ALL profiles without any filters (like tournaments)
    const { data: allProfiles, error } = await supabase
      .from('profiles')
      .select('id, user_name, email, status')
      .limit(1000); // Set a reasonable limit

    console.log(
      'checkUsernameAvailability: Total profiles fetched:',
      allProfiles?.length || 0,
    );

    if (error) {
      console.error('Error checking username availability:', error);
      return {
        available: false,
        error,
        message: 'Error checking username availability',
      };
    }

    if (!allProfiles || allProfiles.length === 0) {
      console.log('checkUsernameAvailability: No profiles found in database');
      return {
        available: true,
        message: 'Username is available',
      };
    }

    console.log(
      'checkUsernameAvailability: Sample profiles:',
      allProfiles.slice(0, 3).map((p) => ({
        username: p.user_name,
        email: p.email,
        status: p.status,
      })),
    );

    // Filter for active users and do case-insensitive username comparison
    const conflictingUsers = allProfiles.filter((user) => {
      // Skip users with 'deleted' status (but allow null status)
      if (user.status === 'deleted') {
        return false;
      }

      // Skip current user if updating
      if (excludeUserId && user.id === excludeUserId) {
        return false;
      }

      // Case-insensitive username comparison
      const dbUsername = (user.user_name || '').toLowerCase();
      const inputUsername = trimmedUsername.toLowerCase();

      const isMatch = dbUsername === inputUsername;

      if (isMatch) {
        console.log(
          `checkUsernameAvailability: MATCH FOUND - "${user.user_name}" matches "${trimmedUsername}"`,
        );
      }

      return isMatch;
    });

    console.log(
      'checkUsernameAvailability: Conflicting users found:',
      conflictingUsers.length,
    );

    if (conflictingUsers.length > 0) {
      console.log(
        'checkUsernameAvailability: Conflicts:',
        conflictingUsers.map((u) => ({
          username: u.user_name,
          status: u.status,
        })),
      );
    }

    const isAvailable = conflictingUsers.length === 0;

    return {
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username already taken',
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
      const inputEmail = trimmedEmail.toLowerCase();

      return dbEmail === inputEmail;
    });

    console.log(
      'checkEmailAvailability: Conflicting users found:',
      conflictingUsers,
    );
    console.log(
      'checkEmailAvailability: Input email (lowercase):',
      trimmedEmail.toLowerCase(),
    );
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
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
    const shouldIncludeDeleted =
      includeDeleted ||
      loggedUser.role === EUserRole.MasterAdministrator ||
      loggedUser.role === EUserRole.CompeteAdmin;
    if (!shouldIncludeDeleted) {
      query.not('status', 'eq', EUserStatus.StatusDeleted);
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

    let data;

    if (type === 'create-user') {
      console.log('SignUp: Creating user via admin API');
      const { data: dataFor, error } =
        await supabaseAdmin.auth.admin.createUser({
          email: newUser.email,
          password: newUser.password,
        });
      data = dataFor;
      if (error) {
        console.error('SignUp: Admin user creation failed:', error);
        throw error;
      }
    } else {
      console.log('SignUp: Creating user via regular signup');
      const { data: dataFor, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });
      data = dataFor;
      if (error) {
        console.error('SignUp: Regular signup failed:', error);
        throw error;
      }
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
        status: null,
        profile_image_url: '',
      });

      if (profileError) {
        console.error('SignUp: Profile creation failed:', profileError);

        // If profile creation fails, clean up the auth user
        try {
          if (type === 'create-user') {
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          } else {
            // For regular signup, the user might need to be deleted via admin API
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          }
          console.log(
            'SignUp: Cleaned up auth user after profile creation failure',
          );
        } catch (cleanupError) {
          console.error('SignUp: Failed to cleanup auth user:', cleanupError);
        }

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

// FIXED SIGNIN FUNCTION - This should resolve the username login issue
export const SignIn = async (userSignIn: ICrudUserData) => {
  const email = userSignIn.email;
  const username = userSignIn.username;
  const password = userSignIn.password;

  // Input validation
  if (!username || !password) {
    console.log('SignIn: Missing username or password');
    return { data: null, error: 'Missing username or password' };
  }

  let emailTemporary: string = email;

  try {
    console.log('SignIn: Starting login process for username:', username);

    // FIXED: Use a simpler, more reliable query approach
    // Get ALL profiles first, then filter client-side to bypass RLS issues
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1000);

    console.log('SignIn: Fetched profiles count:', allProfiles?.length || 0);

    if (fetchError) {
      console.log('SignIn: Error fetching profiles:', fetchError);
      // Continue with email fallback
      emailTemporary = username;
    } else if (allProfiles && allProfiles.length > 0) {
      // Find user by username (case-insensitive, client-side)
      const foundUser = allProfiles.find((user) => {
        // Skip deleted users
        if (user.status === 'deleted') return false;
        
        // Case-insensitive username comparison
        const dbUsername = (user.user_name || '').toLowerCase();
        const inputUsername = username.toLowerCase();
        
        return dbUsername === inputUsername;
      });

      console.log('SignIn: Username lookup result:', {
        found: !!foundUser,
        username: username,
        foundUsername: foundUser?.user_name || null,
        foundEmail: foundUser?.email || null,
      });

      if (foundUser) {
        // User found by username, use their email for authentication
        emailTemporary = foundUser.email;
        console.log('SignIn: Found user by username, using email:', emailTemporary);
      } else {
        // No user found by username, treat input as email
        emailTemporary = username;
        console.log('SignIn: No user found by username, treating input as email:', emailTemporary);
      }
    } else {
      // No profiles found, treat input as email
      emailTemporary = username;
      console.log('SignIn: No profiles found, treating input as email:', emailTemporary);
    }

    // Attempt authentication with Supabase
    console.log('SignIn: Attempting authentication with email:', emailTemporary);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailTemporary,
      password,
    });

    console.log('SignIn: Authentication result:', {
      success: !!data?.user,
      error: error?.message || null,
    });

    if (error) {
      console.log('SignIn: Authentication failed:', error.message);
      throw error;
    }

    // Fetch user profile data
    const { user } = await FetchProfileData(data.user.id);

    // Check if user is deleted
    if (user && user.status === EUserStatus.StatusDeleted) {
      console.log('SignIn: User account is deleted');
      return { error: EUserStatus.StatusDeleted };
    }

    console.log('SignIn: Login successful for user:', user?.user_name);
    return { user, data: data.user, error: null };
  } catch (error: any) {
    console.log('SignIn: Error occurred:', error.message || error);
    return { data: null, error };
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

    // Check if email is being updated
    const isEmailUpdate =
      dataForUpdate.email && dataForUpdate.email.trim() !== '';

    // If email is being updated, update both auth and profile
    if (isEmailUpdate) {
      console.log('Email update detected, updating authentication email...');

      // Update the authentication email first
      const { data: authData, error: authError } =
        await supabase.auth.updateUser({
          email: dataForUpdate.email,
        });

      if (authError) {
        console.error('Failed to update authentication email:', authError);
        return {
          success: false,
          error: authError,
          requiresConfirmation: false,
        };
      }

      console.log('Authentication email update result:', authData);

      // Check if email confirmation is required
      const requiresConfirmation = authData.user?.email_confirmed_at === null;

      if (requiresConfirmation) {
        console.log('Email confirmation required for new email');
      }
    }

    console.log('=== About to update profile in database ===');
    console.log('Update payload:', dataForUpdate);

    // Update the profile data
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
        requiresConfirmation: isEmailUpdate ? true : false,
        message: isEmailUpdate
          ? 'Profile updated. Please check your email to confirm the new email address.'
          : 'Profile updated successfully.',
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
