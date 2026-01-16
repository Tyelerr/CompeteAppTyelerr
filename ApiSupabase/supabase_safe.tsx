import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

// Create a safe Supabase client that won't crash if env vars are missing
let supabase: SupabaseClient;
let supabaseAdmin: SupabaseClient;

try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
    console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

    // Create a dummy client that won't crash
    // This allows the app to at least launch and show an error screen
    supabase = createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );

    supabaseAdmin = supabase;
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error);

  // Create fallback client
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  supabaseAdmin = supabase;
}

export { supabase, supabaseAdmin };
