import { LogOut, Mail, ShieldCheck, UserRound, X } from 'lucide-react';
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
  const { user, name, updateProfile, updatePassword, resetPassword, signOut, resendConfirmation, subscription } =
    useAuth();

  const [profile, setProfile] = useState({ name: name || '', email: user?.email || '' });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const emailConfirmed = user?.email_confirmed_at || user?.confirmed_at;

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');

    const attrs = {};
    if (profile.name !== name) attrs.name = profile.name;

    if (!attrs.name) {
      setInfo('No changes to save.');
      setBusy(false);
      return;
    }

    try {
      const { error: updateError } = await updateProfile(attrs);
      if (updateError) {
        setError(updateError.message);
      } else {
        setInfo('Profile updated.');
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
      <div className="mx-auto max-w-xl border border-line bg-surface p-8 relative">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-red">
          Account
        </p>
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-text">Profile</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-text border border-line hover:border-accent-red hover:text-accent-red transition-colors px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
          >
            Edit
          </button>
        </div>

        {!emailConfirmed && (
          <div className="profile-banner mb-6">
            <ShieldCheck size={16} />
            <span>Your email isn’t confirmed yet.</span>
            <button type="button" className="login-link" onClick={handleResend} disabled={busy}>
              Resend link
            </button>
          </div>
        )}

        <div className="space-y-4 text-sm text-text bg-bg border border-line p-5">
          <div className="flex justify-between items-center">
            <span className="text-text-soft uppercase tracking-wider text-xs font-semibold">Display Name</span>
            <span className="font-mono">{name || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-soft uppercase tracking-wider text-xs font-semibold">Email</span>
            <span className="font-mono">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-soft uppercase tracking-wider text-xs font-semibold">Password</span>
            <span className="font-mono text-text-soft">********</span>
          </div>
        </div>

        <div className="editor-divider my-8" />

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text mb-4">Account Details</h2>
          <div className="space-y-4 text-sm text-text bg-bg border border-line p-5">
            <div className="flex justify-between items-center">
              <span className="text-text-soft uppercase tracking-wider text-xs font-semibold">Account Status</span>
              <span className="font-mono capitalize">{subscription?.status || 'Free'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-soft uppercase tracking-wider text-xs font-semibold">Started Date</span>
              <span className="font-mono">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-soft uppercase tracking-wider text-xs font-semibold">Subscription Expiry</span>
              <span className="font-mono">{subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-soft uppercase tracking-wider text-xs font-semibold">Contact Support</span>
              <span className="font-mono"><a href="mailto:support@ledgerx.com" className="text-accent-red hover:underline">support@ledgerx.com</a></span>
            </div>
          </div>
        </div>

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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-surface border border-line p-8 relative max-h-screen overflow-y-auto">
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setError('');
                setInfo('');
              }}
              className="absolute top-6 right-6 text-text-soft hover:text-text transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-semibold text-text mb-6">Edit Profile</h2>

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
                hint="Email cannot be changed"
              >
                <input
                  className={`${fieldClass} bg-surface text-text-tertiary cursor-not-allowed opacity-70`}
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
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
          </div>
        </div>
      )}
    </main>
  );
}

export default ProfileScreen;
