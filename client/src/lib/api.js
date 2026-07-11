// authFetch: a drop-in wrapper around fetch that attaches the current Supabase
// session's access token as `Authorization: Bearer <jwt>`.
//
// The token is read lazily on each call (Supabase auto-refreshes it), so stale
// tokens are avoided. On 401 the local session is treated as invalid and the
// user is signed out so the app falls back to the login screen.

import { supabase } from './supabaseClient.js';

async function getAccessToken() {
  const devBypass = import.meta.env.DEV && new URLSearchParams(window.location.search).get('devAuth') === '1';
  if (devBypass) return 'dev-token';

  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function authFetch(input, init = {}) {
  const token = await getAccessToken();

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // Preserve an explicit JSON content-type if the caller didn't set headers but
  // is sending a JSON body (matches the existing fetch() call patterns).
  if (init.body && !headers.has('Content-Type') && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    // Session is invalid/expired beyond auto-refresh — force a clean re-auth.
    await supabase.auth.signOut();
  }

  return response;
}

export async function parseApiError(response, fallback = 'Request failed.') {
  try {
    const data = await response.json();
    if (data?.error) return data.error;
  } catch {
    // Response body was not JSON.
  }
  return fallback;
}
