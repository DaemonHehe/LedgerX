import { LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from './Logo.jsx';

const fieldClass = 'editor-field w-full border px-3 py-2.5 text-sm outline-none transition';

function friendlyError(message) {
  // Map the raw Supabase message to something a user can act on.
  if (!message) return 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) {
    return 'Wrong email or password.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Check your inbox and click the confirmation link before signing in.';
  }
  if (/already registered|already been registered/i.test(message)) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (/password should be at least/i.test(message)) {
    return 'Password must be at least 6 characters.';
  }
  return message;
}

function LoginScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setInfo('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError('Enter an email and password to continue.');
      return;
    }

    setBusy(true);
    setError('');
    setInfo('');

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await signUp(
          form.email.trim(),
          form.password,
          form.name.trim(),
        );
        if (signUpError) {
          setError(friendlyError(signUpError.message));
        } else if (!data.session) {
          // Email confirmation required — no session yet.
          setInfo('Account created. Check your inbox to confirm your email, then sign in.');
          setMode('signin');
        }
        // If a session came back immediately, onAuthStateChange handles the rest.
      } else {
        const { error: signInError } = await signIn(form.email.trim(), form.password);
        if (signInError) {
          setError(friendlyError(signInError.message));
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setError('Enter your email above first, then tap "Forgot password?".');
      return;
    }
    setResetting(true);
    setError('');
    setInfo('');
    try {
      const { error: resetError } = await resetPassword(form.email.trim());
      if (resetError) {
        setError(friendlyError(resetError.message));
      } else {
        setInfo('Password reset link sent — check your inbox.');
      }
    } finally {
      setResetting(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const isSignUp = mode === 'signup';

  return (
    <main className="login-shell">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Logo className="w-10 h-10 rounded-none" />
          <Link to="/" className="font-mono text-sm font-bold tracking-tight uppercase no-underline text-text">
            LedgerX
          </Link>
        </div>
        <p className="login-kicker">LedgerX</p>
        <h1>{isSignUp ? 'Create account' : 'Sign in'}</h1>

        {isSignUp && (
          <label>
            <span>Name</span>
            <input
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>
        )}

        <label>
          <span>Email</span>
          <input
            className={fieldClass}
            autoComplete="email"
            placeholder="name@example.com"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
        </label>

        <label>
          <span>Password</span>
          <input
            className={fieldClass}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder="Enter password"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
          />
        </label>

        {error && <p className="login-error">{error}</p>}
        {info && <p className="login-info">{info}</p>}

        <button className="login-button" type="submit" disabled={busy}>
          {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
          {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Login'}
        </button>

        {!isSignUp && (
          <button
            type="button"
            className="login-link"
            onClick={handleForgotPassword}
            disabled={resetting}
          >
            {resetting ? 'Sending…' : 'Forgot password?'}
          </button>
        )}

        <p className="login-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="login-link"
            onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </form>
    </main>
  );
}

export default LoginScreen;
