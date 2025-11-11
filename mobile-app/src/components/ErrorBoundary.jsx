import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want to send this to a logging service
      // Example: sendErrorToService(error, errorInfo);
    }
  }

  handleReload = () => {
    // Clear error state and reload the component
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // If the error persists, reload the entire page
    setTimeout(() => {
      if (this.state.hasError) {
        window.location.reload();
      }
    }, 100);
  };

  handleGoHome = () => {
    // Navigate to home and clear error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-amber-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-red-200 p-8 max-w-md w-full shadow-xl">
            <div className="text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Something went wrong
              </h1>
              
              {/* Error Description */}
              <p className="text-gray-600 mb-6">
                The app encountered an unexpected error. This has been logged and our team will investigate.
              </p>
              
              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-bold text-red-800 text-sm mb-2">Error Details:</h3>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </button>
              </div>
              
              {/* Help Text */}
              <p className="text-gray-500 text-sm mt-6">
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
