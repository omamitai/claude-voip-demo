// src/components/ErrorBoundary.tsx - Error Boundary for graceful error handling
import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
            showDetails: false
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
        
        // In production, you would send this to an error reporting service
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false
        });
        
        // Reload the page to ensure clean state
        window.location.reload();
    };

    toggleDetails = () => {
        this.setState(prev => ({ showDetails: !prev.showDetails }));
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-lg w-full"
                    >
                        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-red-500/20">
                            {/* Error Icon */}
                            <motion.div
                                initial={{ rotate: 0 }}
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                                className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <AlertTriangle className="w-10 h-10 text-red-400" />
                            </motion.div>

                            {/* Error Message */}
                            <h1 className="text-2xl font-bold text-center mb-4">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-gray-400 text-center mb-8">
                                An unexpected error occurred. Don't worry, your data is safe.
                            </p>

                            {/* Error Details (Collapsible) */}
                            <div className="mb-6">
                                <button
                                    onClick={this.toggleDetails}
                                    className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <Bug className="w-4 h-4 mr-2" />
                                    {this.state.showDetails ? 'Hide' : 'Show'} technical details
                                </button>
                                
                                {this.state.showDetails && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 p-4 bg-gray-900/50 rounded-lg overflow-auto max-h-64"
                                    >
                                        <pre className="text-xs text-red-300 font-mono">
                                            {this.state.error?.toString()}
                                            {'\n\n'}
                                            {this.state.errorInfo?.componentStack}
                                        </pre>
                                    </motion.div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                                <button
                                    onClick={this.handleReset}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    <span>Try Again</span>
                                </button>
                                
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Go Home</span>
                                </button>
                            </div>

                            {/* Support Link */}
                            <p className="text-center text-sm text-gray-500 mt-6">
                                If this problem persists, please{' '}
                                <a href="#" className="text-indigo-400 hover:text-indigo-300">
                                    contact support
                                </a>
                            </p>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
