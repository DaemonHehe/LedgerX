// Auth context: owns the Supabase auth lifecycle for the app.
//
// State is driven by supabase.auth.onAuthStateChange (one subscription), so any
// login/logout/token-refresh — even from another tab — keeps the UI in sync.
// The display name lives in user_metadata.full_name (set at sign-up, editable
// from ProfileScreen). All auth actions return Supabase's { data, error } so
// callers can show precise messages.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

const displayName = (user) => user?.user_metadata?.full_name || '';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  // `loading` covers the initial async getSession(); we start true so the app
  // doesn't flash the login screen before the stored session is confirmed.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const devBypass = import.meta.env.DEV && new URLSearchParams(window.location.search).get('devAuth') === '1';

    if (devBypass) {
      setSession({ user: { email: 'dev@example.com', user_metadata: { full_name: 'Dev User' } } });
      setUser({ email: 'dev@example.com', user_metadata: { full_name: 'Dev User' } });
      setLoading(false);
      return undefined;
    }

    // Resolve any persisted session once on mount.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to all subsequent auth changes.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // --- auth actions ---

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = async (email, password, name) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name || '' } },
    });
    // Some Supabase setups return a session immediately (confirm-email off);
    // onAuthStateChange will pick it up. Return raw result for the caller.
    return result;
  };

  const signOut = () => supabase.auth.signOut();

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    });

  // Profile / password updates operate on the currently logged-in user.
  const updateProfile = ({ name, email }) => {
    const attrs = {};
    if (typeof name === 'string') attrs.data = { full_name: name };
    if (typeof email === 'string') attrs.email = email;
    return supabase.auth.updateUser(attrs);
  };

  const updatePassword = (password) =>
    supabase.auth.updateUser({ password });

  const resendConfirmation = (email) =>
    supabase.auth.resend({ type: 'signup', email });

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      name: displayName(user),
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      updatePassword,
      resendConfirmation,
    }),
    [session, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
