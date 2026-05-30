import { LogIn } from 'lucide-react';
import { useState } from 'react';

function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError('Enter an email and password to continue.');
      return;
    }

    onLogin({
      name: form.name.trim(),
      email: form.email.trim(),
    });
  };

  return (
    <main className="login-shell">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="login-mark">RG</div>
        <p className="login-kicker">Receipt Studio</p>
        <h1>Sign in</h1>

        <label>
          <span>Name</span>
          <input
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
        </label>

        <label>
          <span>Email</span>
          <input
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
            autoComplete="current-password"
            placeholder="Enter password"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button className="login-button" type="submit">
          <LogIn size={18} />
          Login
        </button>
      </form>
    </main>
  );
}

export default LoginScreen;
