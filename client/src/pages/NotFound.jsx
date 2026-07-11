import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();
  const workspacePath = user ? '/templates' : '/login';

  return (
    <div className="not-found-page min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--ink)] px-6">
      <Logo className="w-12 h-12 rounded-none mb-8" />
      <h1 className="not-found-code rounded-none">404</h1>
      <p className="not-found-message rounded-none">SYSTEM ERROR: ROUTE NOT FOUND</p>
      <Link
        to={workspacePath}
        className="not-found-action rounded-none mt-8 px-8 py-3 text-xs font-semibold uppercase tracking-[0.14em]"
      >
        Return to Workspace
      </Link>
    </div>
  );
}
