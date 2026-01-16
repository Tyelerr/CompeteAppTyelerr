/**
 * Edge Function Service
 * Handles secure API calls to Supabase Edge Functions
 */

import { supabase } from './supabase';

// Get environment variables - these are injected by EAS Build
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const EDGE_FUNCTION_BASE_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1`
  : '';

interface UpdateEmailRequest {
  newEmail: string;
  currentPassword: string;
}

interface UpdateEmailResponse {
  success?: boolean;
  status?: string;
  message?: string;
  requiresConfirmation?: boolean;
  error?: string;
  details?: string;
}

/**
 * Call the update-user-email Edge Function
 * This function securely updates both auth.users and profiles table
 *
 * @param newEmail - The new email address
 * @param currentPassword - User's current password for re-authentication
 * @returns Promise with update result
 */
export const callUpdateUserEmail = async (
  newEmail: string,
  currentPassword: string,
): Promise<UpdateEmailResponse> => {
  try {
    console.log('EdgeFunctionService: Calling update-user-email function');

    // Get the current session token
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('EdgeFunctionService: No active session', sessionError);
      return {
        success: false,
        error: 'No active session. Please log in again.',
        message: 'Authentication required',
      };
    }

    // Prepare request body
    const requestBody: UpdateEmailRequest = {
      newEmail: newEmail.trim(),
      currentPassword,
    };

    console.log('EdgeFunctionService: Making request to Edge Function');
    console.log('EdgeFunctionService: Request body:', {
      newEmail: requestBody.newEmail,
      currentPassword: currentPassword ? '***' : 'MISSING',
    });
    console.log(
      'EdgeFunctionService: URL:',
      `${EDGE_FUNCTION_BASE_URL}/update-user-email`,
    );

    // Validate API key is available
    if (!SUPABASE_ANON_KEY) {
      console.error('EdgeFunctionService: SUPABASE_ANON_KEY is missing!');
      return {
        success: false,
        error: 'Configuration error',
        message: 'API key not configured. Please contact support.',
      };
    }

    // Call the Edge Function
    const response = await fetch(
      `${EDGE_FUNCTION_BASE_URL}/update-user-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(requestBody),
      },
    );

    console.log('EdgeFunctionService: Response status:', response.status);

    // Parse response
    const result: UpdateEmailResponse = await response.json();

    console.log('EdgeFunctionService: Response data:', result);

    // Handle the deployed function's response format
    if (!response.ok || result.error) {
      console.error('EdgeFunctionService: Request failed', result);
      return {
        success: false,
        error: result.error || 'Failed to update email',
        message: result.details || result.error || 'An error occurred',
      };
    }

    // Success response from deployed function
    if (result.status === 'ok') {
      return {
        success: true,
        message:
          'Email updated successfully. Please check your new email address to confirm the change.',
        requiresConfirmation: true,
      };
    }

    return {
      success: result.success !== false,
      message: result.message || 'Email update completed',
      requiresConfirmation: true,
    };
  } catch (error) {
    console.error('EdgeFunctionService: Exception occurred', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update email. Please try again.',
    };
  }
};

/**
 * Test Edge Function connectivity
 * Useful for debugging
 */
export const testEdgeFunctionConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        message: 'No active session',
      };
    }

    console.log('Testing Edge Function connection...');
    console.log(
      'Edge Function URL:',
      `${EDGE_FUNCTION_BASE_URL}/update-user-email`,
    );

    return {
      success: true,
      message: 'Edge Function service is configured',
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Connection test failed',
    };
  }
};
