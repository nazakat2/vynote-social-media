'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Loading chunk') ||
                          this.state.error?.message?.includes('Unexpected token');
      const isNetworkError = this.state.error?.message?.includes('Failed to fetch') ||
                            this.state.error?.message?.includes('NetworkError');

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg, #fafafa)',
          padding: 20,
        }}>
          <div style={{
            maxWidth: 400,
            textAlign: 'center',
            padding: 40,
            background: 'var(--card-bg, #fff)',
            borderRadius: 20,
            boxShadow: '0 10px 40px rgba(0,0,0,.1)',
          }}>
            <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>
              {isChunkError ? '🔄' : isNetworkError ? '📡' : '⚠️'}
            </span>
            <h2 style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--ink, #222)',
              marginBottom: 8,
            }}>
              {isChunkError ? 'Update Available' : isNetworkError ? 'Connection Error' : 'Something went wrong'}
            </h2>
            <p style={{
              fontSize: 14,
              color: 'var(--sub, #888)',
              marginBottom: 24,
              lineHeight: 1.5,
            }}>
              {isChunkError
                ? 'A new version is available. Please reload the page.'
                : isNetworkError
                  ? 'Please check your internet connection and try again.'
                  : 'An unexpected error occurred. Please try again.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={isChunkError ? this.handleReload : this.handleReset}
                style={{
                  padding: '12px 28px',
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, #ff2442, #ff7a59)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255,36,66,.35)',
                }}
              >
                {isChunkError ? 'Reload Page' : 'Try Again'}
              </button>
              {!isChunkError && (
                <button
                  onClick={this.handleReload}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 22,
                    background: 'var(--input-bg, #f5f5f7)',
                    color: 'var(--ink, #222)',
                    fontWeight: 600,
                    fontSize: 14,
                    border: '1px solid var(--line, #e5e5e5)',
                    cursor: 'pointer',
                  }}
                >
                  Reload Page
                </button>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary style={{ fontSize: 12, color: 'var(--sub, #888)', cursor: 'pointer' }}>
                  Error Details (Development)
                </summary>
                <pre style={{
                  marginTop: 8,
                  padding: 12,
                  background: 'var(--input-bg, #f5f5f7)',
                  borderRadius: 8,
                  fontSize: 11,
                  overflow: 'auto',
                  maxHeight: 150,
                  color: 'var(--ink, #222)',
                }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
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
