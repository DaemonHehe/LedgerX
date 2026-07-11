import { useState } from 'react';
import { Check } from 'lucide-react';
import { authFetch } from '../lib/api';
import CheckoutModal from './CheckoutModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const TIERS = [
  {
    name: '1-Month',
    price: '$10',
    billing: 'Billed monthly at $10',
    priceId: import.meta.env.VITE_STRIPE_PRICE_1_MONTH || 'price_1_month_placeholder',
    features: ['Unlimited template exports', 'AI Template Generation', 'Database backup', 'Standard support'],
    recommended: false,
  },
  {
    name: '3-Month',
    price: '$7',
    billing: 'Billed quarterly at $21',
    priceId: import.meta.env.VITE_STRIPE_PRICE_3_MONTH || 'price_3_month_placeholder',
    features: ['Unlimited template exports', 'AI Template Generation', 'Database backup', 'Priority support'],
    recommended: false,
  },
  {
    name: '6-Month',
    price: '$5',
    billing: 'Billed semi-annually at $30',
    priceId: import.meta.env.VITE_STRIPE_PRICE_6_MONTH || 'price_6_month_placeholder',
    features: ['Unlimited template exports', 'AI Template Generation', 'Database backup', '24/7 Priority support', 'Early access to new features'],
    recommended: true,
  },
];

export default function Pricing() {
  const [loadingPriceId, setLoadingPriceId] = useState(null);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const handleSubscribe = async (priceId) => {
    setLoadingPriceId(priceId);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/stripe/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create checkout session';
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.url) {
        // Fallback in case backend returns URL
        window.location.href = data.url;
      }
      setLoadingPriceId(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to initiate checkout. Please try again later.');
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          LedgerX Pro
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Unlock the full potential of your workspace.
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-none border border-[var(--accent-red)] bg-red-900/20 p-4 text-center text-[var(--accent-red)]">
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col border ${tier.recommended ? 'border-[var(--accent-red)] shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'border-[var(--line)]'
              } bg-[var(--bg-secondary)] p-8 transition-colors hover:border-[var(--text-primary)]`}
          >
            {tier.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] px-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-red)]">
                  Best Value
                </span>
              </div>
            )}

            <div className="mb-8">
              <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">{tier.name}</h3>
              <div className="mb-1 flex items-baseline">
                <span className="text-4xl font-bold text-[var(--text-primary)]">{tier.price}</span>
                <span className="ml-1 text-[var(--text-tertiary)]">/mo</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{tier.billing}</p>
            </div>

            <ul className="mb-8 flex-1 space-y-4">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm text-[var(--text-secondary)]">
                  <Check className="mr-3 h-5 w-5 shrink-0 text-[var(--accent-red)]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(tier.priceId)}
              disabled={loadingPriceId !== null}
              className={`w-full rounded-none border py-3 text-sm font-semibold tracking-widest transition-colors ${tier.recommended
                ? 'border-[var(--accent-red)] bg-[var(--accent-red)] text-white hover:bg-transparent hover:text-[var(--accent-red)]'
                : 'border-[var(--line)] bg-transparent text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                } disabled:opacity-50`}
            >
              {loadingPriceId === tier.priceId ? 'LOADING...' : 'SUBSCRIBE'}
            </button>
          </div>
        ))}
      </div>

      {clientSecret && (
        <CheckoutModal 
          clientSecret={clientSecret} 
          onClose={() => setClientSecret(null)} 
        />
      )}
    </div>
  );
}
