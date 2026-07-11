import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { X } from 'lucide-react';

export default function CheckoutModal({ clientSecret, onClose }) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    // Only initialize stripe promise when the modal is opened
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';
    setStripePromise(loadStripe(publishableKey));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="relative w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--line)] shadow-2xl flex flex-col h-[90vh] md:h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] p-4 bg-[var(--bg-secondary)] shrink-0">
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Checkout</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[var(--line)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Checkout Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
          {stripePromise && clientSecret && (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
          {(!stripePromise || !clientSecret) && (
            <div className="flex h-full items-center justify-center">
              <p className="text-black animate-pulse">Loading secure checkout...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
