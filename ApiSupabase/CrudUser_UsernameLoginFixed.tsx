// FIXED VERSION - Username Login Issue
// This file contains the corrected SignIn function that properly handles username login

import { Alert } from 'react-native';
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

// FIXED SIGNIN FUNCTION - Properly handles username login
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
      // Input is a username, look it up
      console.log('SignIn: Input is username format, looking up email...');

      const { data: userProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('email, user_name, status, id')
        .ilike('user_name', trimmedInput)
        .or('status.is.null,status.neq.deleted')
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

// Helper function to fetch profile data
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
