import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error(`[DevDesk ErrorBoundary] Captured crash in ${this.props.componentName || 'component'}:`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    this.props.onReset?.();
  };

  handleGoHome = (): void => {
    this.handleReset();
    window.location.hash = '';
    // If running in context, trigger navigation or fallback reload
    window.dispatchEvent(new CustomEvent('devdesk:navigate-home'));
  };

  handleCopy = (): void => {
    const errorDetails = `[DevDesk Crash Report]
Component: ${this.props.componentName || 'Unknown'}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack || 'No stack'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
Time: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="workspace-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div
            style={{
              maxWidth: 580,
              width: '100%',
              padding: 32,
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'var(--danger-subtle)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                {this.props.componentName ? `Failed to load ${this.props.componentName}` : 'An unexpected error occurred'}
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 440 }}>
                DevDesk safely intercepted a runtime exception to preserve your unsaved workspace data. You can retry rendering or return to the dashboard.
              </p>
            </div>

            {this.state.error && (
              <div
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'var(--bg-code)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--danger)',
                  maxHeight: 120,
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={this.handleReset}
              >
                <RefreshCw size={14} />
                <span>Retry View</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={this.handleGoHome}
              >
                <Home size={14} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={this.handleCopy}
              >
                {this.state.copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                <span>{this.state.copied ? 'Copied Details' : 'Copy Report'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
