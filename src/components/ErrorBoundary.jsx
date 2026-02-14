import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
                    <div className="max-w-2xl w-full bg-slate-800 p-6 rounded-lg border border-red-500/50 shadow-2xl">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                        <div className="bg-black/50 p-4 rounded overflow-auto mb-4 border border-white/10">
                            <code className="text-red-300 block mb-2">{this.state.error && this.state.error.toString()}</code>
                            <pre className="text-xs text-slate-400 whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                        >
                            Reload Application
                        </button>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            className="ml-4 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                        >
                            Clear Data & Reload (Hard Reset)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
