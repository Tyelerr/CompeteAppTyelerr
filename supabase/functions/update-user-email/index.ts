import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

// Edge Function: update-user-email
// Expects Authorization: Bearer <access_token>
// Body: { newEmail }
// NO PASSWORD VALIDATION - User is already authenticated with valid session

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('CRITICAL ERROR: Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
}

const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('=== EDGE FUNCTION INVOKED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('Environment variables not set!');
      return json(
        {
          error: 'Server configuration error',
          details: 'Missing required environment variables',
        },
        500,
      );
    }

    if (req.method !== 'POST')
      return json({ error: 'Method not allowed' }, 405);

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) return json({ error: 'Missing access token' }, 401);

    const body = await req.json().catch(() => null);
    if (!body || !body.newEmail)
      return json({ error: 'Invalid body - newEmail required' }, 400);

    const { newEmail, currentPassword } = body;

    console.log('=== EMAIL UPDATE REQUEST ===');
    console.log('newEmail:', newEmail);
    console.log('currentPassword provided:', !!currentPassword);

    // Validate that password is provided
    if (!currentPassword || currentPassword.trim() === '') {
      console.log('Password not provided');
      return json(
        { error: 'Current password is required for security verification' },
        400,
      );
    }

    // Get user info from JWT
    console.log('Fetching user info with token...');
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SERVICE_ROLE_KEY,
      },
    });

    console.log('User fetch response status:', userResp.status);

    if (userResp.status !== 200) {
      const errorText = await userResp.text();
      console.error('Failed to fetch user:', errorText);
      return json(
        {
          error: 'Session expired or invalid. Please log out and log back in.',
          details: errorText,
        },
        401,
      );
    }

    const user = await userResp.json();
    const userId = user.id;
    const oldEmail = user.email;

    console.log('User ID:', userId);
    console.log('Current email:', oldEmail);
    console.log('New email:', newEmail);

    // VALIDATE PASSWORD - Re-authenticate user with current password
    console.log('Validating current password...');
    const signInResp = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          email: oldEmail,
          password: currentPassword,
        }),
      },
    );

    if (signInResp.status !== 200) {
      console.log('Password validation failed');
      const errorData = await signInResp.json().catch(() => ({}));
      console.error('Sign-in error:', errorData);
      return json(
        {
          error: 'Incorrect password',
          details: 'The password you entered is incorrect. Please try again.',
        },
        401,
      );
    }

    console.log('Password validated successfully');

    // Check if new email already exists
    const checkResp = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(
        newEmail,
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
      },
    );

    if (checkResp.status === 200) {
      const users = await checkResp.json();
      if (Array.isArray(users) && users.length > 0) {
        console.log('Email already in use');
        return json({ error: 'Email already in use' }, 409);
      }
    }

    // Update auth.users
    console.log('Updating auth.users email...');
    const updateAuthResp = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          email: newEmail,
          email_confirm: true,
        }),
      },
    );

    if (updateAuthResp.status !== 200) {
      const err = await updateAuthResp.text();
      console.error('Failed to update auth.users:', err);
      return json({ error: 'Failed to update auth.users', details: err }, 500);
    }

    console.log('auth.users updated successfully');

    // Update profiles table
    console.log('Updating profiles table...');
    const profilesResp = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          email: newEmail,
        }),
      },
    );

    console.log('Profiles update response status:', profilesResp.status);
    const profilesText = await profilesResp.text();
    console.log('Profiles update response:', profilesText);

    if (![200, 204].includes(profilesResp.status)) {
      console.log('Profiles update failed, rolling back auth.users...');
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          email: oldEmail,
        }),
      });
      const err = await profilesResp.text();
      return json(
        {
          error: 'Failed to update profiles table. Auth rolled back.',
          details: err,
        },
        500,
      );
    }

    console.log('Profiles table updated successfully');
    console.log('=== EMAIL UPDATE COMPLETE ===');
    console.log('Email updated to:', newEmail);

    return json(
      {
        status: 'ok',
        message: 'Email updated successfully',
        newEmail: newEmail,
      },
      200,
    );
  } catch (e) {
    console.error('Unhandled error:', e);
    return json({ error: 'Internal server error' }, 500);
  }
});
