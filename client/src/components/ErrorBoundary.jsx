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
        <main className="min-h-screen flex items-center justify-center bg-white p-6">
          <div className="max-w-md border border-[#e0e0e0] bg-white p-8">
            <h1 className="mb-4 text-2xl font-semibold text-black">Something went wrong</h1>
            <p className="mb-6 text-sm text-gray-600">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            <button
              className="w-full border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black hover:border-[#ff0000] hover:text-[#ff0000]"
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
