// ApiSupabase/AdminAuthHelpers.ts
import { supabase, supabaseAdmin } from './supabase_safe';
import { EUserRole, EUserStatus } from '../hooks/InterfacesGlobal';
import { validateUserUniqueness } from './CrudUser';

/** Create a user via Supabase Auth Admin API (server-side) */
export async function AdminCreateUser(
  email: string,
  password: string,
  user_name: string,
) {
  try {
    console.log('AdminCreateUser: Starting user creation process');
    console.log('AdminCreateUser: Email:', email);
    console.log('AdminCreateUser: Username:', user_name);

    // Validate username and email uniqueness before creating user
    const validation = await validateUserUniqueness(user_name, email);

    if (!validation.valid) {
      console.log('AdminCreateUser: Validation failed:', validation.errors);

      // Return specific error information
      const errorMessage = validation.errors.join(' ');
      return {
        data: null,
        error: {
          message: errorMessage,
          details: {
            usernameAvailable: validation.usernameAvailable,
            emailAvailable: validation.emailAvailable,
            errors: validation.errors,
          },
        },
      };
    }

    console.log('AdminCreateUser: Validation passed, creating user');

    // Use admin API to create user directly without email confirmation
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { user_name },
      email_confirm: true, // Auto-confirm email for admin-created users
    });

    if (error) {
      console.error('AdminCreateUser: Auth user creation failed:', error);
      throw error;
    }

    console.log('AdminCreateUser: Auth user created successfully');

    // If user was created successfully, also create/update the profile
    if (data.user) {
      console.log('AdminCreateUser: Creating user profile');
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          user_name: user_name,
          name: user_name, // Use username as name for display purposes
          preferred_game: '',
          skill_level: '',
          zip_code: '',
          favorite_player: '',
          favorite_game: '',
          role: EUserRole.BasicUser,
          status: EUserStatus.StatusActive, // FIXED: Set status to 'active' for admin-created users
          profile_image_url: '',
          home_city: '',
          home_state: '',
        });

      if (profileError) {
        console.error(
          'AdminCreateUser: Profile creation failed:',
          profileError,
        );

        // If profile creation fails, we should clean up the auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          console.log(
            'AdminCreateUser: Cleaned up auth user after profile creation failure',
          );
        } catch (deleteError) {
          console.error(
            'AdminCreateUser: Error deleting auth user after profile creation failure:',
            deleteError,
          );
        }

        // Check if the error is due to uniqueness constraint violation
        if (
          profileError.message &&
          (profileError.message.includes('duplicate key') ||
            profileError.message.includes('unique constraint'))
        ) {
          throw new Error(
            'Username or email already exists. Please choose different values.',
          );
        }

        throw new Error(
          `Failed to create user profile: ${profileError.message}`,
        );
      }

      console.log('AdminCreateUser: Profile created successfully');
    }

    console.log('AdminCreateUser: User creation completed successfully');
    return { data, error: null };
  } catch (error: any) {
    console.error('AdminCreateUser: Exception occurred:', error);

    // Handle specific error types for better user feedback
    if (error.message) {
      if (
        error.message.includes('username') ||
        error.message.includes('user_name')
      ) {
        return {
          data: null,
          error: {
            message: 'This username is already taken',
            type: 'username-conflict',
          },
        };
      }
      if (error.message.includes('email')) {
        return {
          data: null,
          error: {
            message: 'This email address is already registered',
            type: 'email-conflict',
          },
        };
      }
      if (
        error.message.includes('duplicate key') ||
        error.message.includes('unique constraint')
      ) {
        return {
          data: null,
          error: {
            message: 'Username or email already exists',
            type: 'duplicate-data',
          },
        };
      }
    }

    return {
      data: null,
      error: {
        message: error.message || 'An error occurred while creating the user',
        type: 'general-error',
      },
    };
  }
}

/** Admin function to update user role in both auth metadata and profile */
export async function AdminUpdateUserRole(userId: string, newRole: EUserRole) {
  try {
    console.log('AdminUpdateUserRole: Starting role update process');
    console.log('AdminUpdateUserRole: User ID:', userId);
    console.log('AdminUpdateUserRole: New Role:', newRole);

    // Update the authentication user metadata
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole },
      });

    if (authError) {
      console.error(
        'AdminUpdateUserRole: Auth metadata update failed:',
        authError,
      );
      throw authError;
    }

    console.log('AdminUpdateUserRole: Auth metadata updated successfully');

    // Update the profile table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error(
        'AdminUpdateUserRole: Profile update failed:',
        profileError,
      );
      throw profileError;
    }

    console.log('AdminUpdateUserRole: Profile updated successfully');
    console.log('AdminUpdateUserRole: Role update completed successfully');

    return { data: profileData, error: null };
  } catch (error: any) {
    console.error('AdminUpdateUserRole: Exception occurred:', error);
    return {
      data: null,
      error: {
        message: error.message || 'An error occurred while updating user role',
        type: 'role-update-error',
      },
    };
  }
}

/** Right after sign-up, find the profile row so we know the UUID */
export async function FindProfileIdByEmail(email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return { data, error };
}
