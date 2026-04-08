import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">დაფიქსირდა შეცდომა</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            {this.state.error?.message || 'სისტემური შეცდომა. გთხოვთ სცადოთ თავიდან.'}
          </p>
          <Button onClick={this.handleRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            თავიდან ცდა
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;