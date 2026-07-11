import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6">
          <div className="max-w-md border border-[var(--line)] bg-[var(--bg-secondary)] p-8 shadow-sm">
            <h1 className="mb-4 text-2xl font-semibold text-[var(--ink)] font-mono uppercase tracking-tight">Something went wrong</h1>
            <p className="mb-8 text-sm text-[var(--ink-soft)] font-mono">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            <button
              className="w-full border border-[var(--ink)] bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--bg-primary)] transition-colors hover:border-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white uppercase tracking-widest font-mono"
              onClick={() => window.location.reload()}
              type="button"
            >
              Refresh Page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
