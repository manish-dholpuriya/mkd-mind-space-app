import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MindSpace Error Boundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-5 border border-gray-100">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center">
              <span className="text-3xl">😔</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              MindSpace ran into an unexpected issue. Your data is safe in local storage — just reload to get back on track.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-brand-teal text-white font-bold text-sm rounded-xl hover:bg-brand-teal/90 transition-all shadow-sm cursor-pointer"
            >
              Reload MindSpace
            </button>
            {this.state.error && (
              <details className="text-left mt-4">
                <summary className="text-xs text-gray-400 font-semibold cursor-pointer hover:text-gray-600">
                  Technical details
                </summary>
                <pre className="mt-2 text-[10px] text-gray-400 bg-gray-50 p-3 rounded-lg overflow-auto max-h-32 font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
