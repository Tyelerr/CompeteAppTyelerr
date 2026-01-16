import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// EAS Build automatically injects environment variables from .env file
// They are available as process.env.EXPO_PUBLIC_*
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that environment variables are present
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!');
  console.error('Make sure your .env file contains:');
  console.error('  EXPO_PUBLIC_SUPABASE_URL');
  console.error('  EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.warn(
    '⚠️  Note: Service role key should NEVER be in client app - use Edge Functions instead',
  );
  console.error('❌ App will not function properly without these variables!');
}

// Create Supabase client with proper error handling
let supabaseClient: SupabaseClient | null = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.error('❌ Cannot create Supabase client: Missing credentials');
  }
} catch (error) {
  console.error('❌ Error creating Supabase client:', error);
}

// Export the client - functions should check if it's null before using
export const supabase = supabaseClient as SupabaseClient;

// Helper function to check if Supabase is properly initialized
export const isSupabaseInitialized = (): boolean => {
  return supabaseClient !== null && supabaseClient.auth !== undefined;
};

// Helper function to get initialization error message
export const getSupabaseInitError = (): string => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return 'Supabase configuration is missing. Please check your environment variables.';
  }
  if (!supabaseClient) {
    return 'Supabase client failed to initialize. Please restart the app.';
  }
  return 'Unknown Supabase initialization error.';
};

// SECURITY NOTE: supabaseAdmin has been removed from client code
// Service role operations should ONLY be performed server-side via Edge Functions
// See: CompeteApp/supabase/functions/ for secure server-side operations
