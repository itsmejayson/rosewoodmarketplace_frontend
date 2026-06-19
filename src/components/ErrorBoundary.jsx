import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-6">
              The app encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rosewood-600 text-white rounded-md hover:bg-rosewood-700 text-sm font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
