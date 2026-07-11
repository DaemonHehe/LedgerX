import { LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const fieldClass = 'editor-field w-full border px-3 py-2.5 text-sm outline-none transition';
const labelClass = 'editor-label';

function Row({ label, icon: Icon, children, hint }) {
  return (
    <label className="block">
      <span className={labelClass}>
        {Icon ? <Icon size={13} className="inline -mt-0.5 mr-1" /> : null}
        {label}
      </span>
      {children}
      {hint ? <span className="editor-hint">{hint}</span> : null}
    </label>
  );
}

function ProfileScreen() {
  const { user, name, updateProfile, updatePassword, resetPassword, signOut, resendConfirmation } =
    useAuth();

  const [profile, setProfile] = useState({ name: name || '', email: user?.email || '' });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const emailConfirmed = user?.email_confirmed_at || user?.confirmed_at;

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');

    const attrs = {};
    if (profile.name !== name) attrs.name = profile.name;
    if (profile.email !== user?.email) attrs.email = profile.email;

    if (!attrs.name && attrs.email === undefined) {
      setInfo('No changes to save.');
      setBusy(false);
      return;
    }

    try {
      const { error: updateError } = await updateProfile(attrs);
      if (updateError) {
        setError(updateError.message);
      } else {
        setInfo(
          attrs.email
            ? 'Profile updated. If you changed your email, confirm the new address via the link sent to it.'
            : 'Profile updated.',
        );
        setPassword('');
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError.message);
      } else {
        setInfo('Password updated.');
        setPassword('');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const { error: resetError } = await resetPassword(user?.email);
      if (resetError) setError(resetError.message);
      else setInfo('Reset link sent to your email.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const { error: resendError } = await resendConfirmation(user.email);
      if (resendError) setError(resendError.message);
      else setInfo('Confirmation email re-sent.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-shell min-h-screen overflow-x-hidden p-6 text-neutral-950">
      <div className="mx-auto max-w-xl border border-line bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-red">
          Account
        </p>
        <h1 className="mb-6 text-3xl font-semibold text-text">Profile</h1>

        {!emailConfirmed && (
          <div className="profile-banner">
            <ShieldCheck size={16} />
            <span>Your email isn’t confirmed yet.</span>
            <button type="button" className="login-link" onClick={handleResend} disabled={busy}>
              Resend link
            </button>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleProfileSave}>
          <Row label="Display name" icon={UserRound}>
            <input
              className={fieldClass}
              value={profile.name}
              onChange={(event) => setProfile((p) => ({ ...p, name: event.target.value }))}
              placeholder="Your name"
            />
          </Row>

          <Row
            label="Email"
            icon={Mail}
            hint={emailConfirmed ? 'Confirmed' : 'Not confirmed yet'}
          >
            <input
              className={fieldClass}
              type="email"
              value={profile.email}
              onChange={(event) => setProfile((p) => ({ ...p, email: event.target.value }))}
            />
          </Row>

          <button type="submit" className="login-button" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        <div className="editor-divider my-8" />

        <form className="space-y-5" onSubmit={handlePasswordSave}>
          <Row label="New password" icon={ShieldCheck} hint="At least 6 characters">
            <input
              className={fieldClass}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a new password"
            />
          </Row>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="login-button flex-none" disabled={busy}>
              {busy ? 'Saving…' : 'Update password'}
            </button>
            <button type="button" className="login-link" onClick={handleForgot} disabled={busy}>
              Forgot password?
            </button>
          </div>
        </form>

        {error && <p className="login-error mt-5">{error}</p>}
        {info && <p className="login-info mt-5">{info}</p>}

        <div className="editor-divider my-8" />

        <button
          type="button"
          className="logout-button"
          onClick={() => signOut()}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </main>
  );
}

export default ProfileScreen;
