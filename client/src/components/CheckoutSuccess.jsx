import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { authFetch } from '../lib/api';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    let timer;
    const verifyAndRedirect = async () => {
      if (sessionId) {
        try {
          // Manual verification fallback since local webhooks are blocked
          await authFetch(`${API_BASE_URL}/api/stripe/verify-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });
        } catch (error) {
          console.error('Session verification error:', error);
        }
      }
      
      timer = setTimeout(() => {
        // Force full reload so AuthContext refetches the pro status from DB
        window.location.href = '/receipt';
      }, 3000);
    };

    verifyAndRedirect();
    
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center text-center">
      <CheckCircle className="mb-4 h-16 w-16 text-[var(--accent-red)]" />
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        Payment Successful
      </h1>
      <p className="mb-8 max-w-md text-[var(--text-secondary)]">
        Thank you for upgrading to LedgerX Pro. Your subscription is now active.
      </p>
      
      {sessionId && (
        <p className="mb-8 text-xs text-[var(--text-tertiary)] font-mono">
          Session ID: {sessionId}
        </p>
      )}

      <button
        onClick={() => navigate('/receipt')}
        className="rounded-none border border-[var(--line)] bg-[var(--bg-secondary)] px-8 py-3 text-sm font-semibold tracking-widest text-[var(--text-primary)] transition-colors hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
      >
        RETURN TO WORKSPACE
      </button>
    </div>
  );
}
