import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const showError = useCallback(
    (message) => showToast(message.startsWith('Error:') ? message : `Error: ${message}`, 'error'),
    [showToast]
  );

  const showSuccess = useCallback(
    (message) => showToast(message, 'success'),
    [showToast]
  );

  const value = useMemo(
    () => ({ showError, showSuccess, dismissToast }),
    [showError, showSuccess, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`ledgerx-toast rounded-none ${
            toast.type === 'error' ? 'ledgerx-toast-error' : 'ledgerx-toast-success'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
