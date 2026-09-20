import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Chakkibook ErrorBoundary Caught Error]:", error, errorInfo);
    this.setState({ errorInfo });
    
    if (typeof window !== 'undefined') {
      window.__last_chakkibook_error = {
        message: error?.message || String(error),
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString()
      };
    }

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (err) {
        console.error("Error in ErrorBoundary onError prop:", err);
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetErrorBoundary: this.handleReset
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          backgroundColor: '#fffbeb',
          color: '#78350f',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '1.25rem',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.75rem',
            marginBottom: '1.25rem',
            border: '2px solid #fde68a',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
          }}>
            🌾
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#b45309',
            marginBottom: '0.75rem',
            lineHeight: 1.3
          }}>
            Oops! Screen Refresh Ki Zaroorat Hai
          </h1>

          <p style={{
            fontSize: '1rem',
            color: '#92400e',
            maxWidth: '420px',
            lineHeight: 1.5,
            marginBottom: '0.5rem'
          }}>
            Chakkibook me koi chhota sa takniki issue aa gaya hai. Aapka ledger aur khata bilkul safe hai.
          </p>

          <p style={{
            fontSize: '0.875rem',
            color: '#b45309',
            marginBottom: '1.75rem'
          }}>
            Kripya screen reload karein ya dobara koshish karein.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
            >
              🔄 Refresh & Reload
            </button>

            <button
              onClick={this.handleHome}
              style={{
                backgroundColor: '#ffffff',
                color: '#78350f',
                border: '1.5px solid #d97706',
                borderRadius: '0.75rem',
                padding: '12px 20px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🏠 Go to Home
            </button>
          </div>

          {this.state.error && (
            <details style={{
              marginTop: '1rem',
              textAlign: 'left',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.75rem',
              maxWidth: '92vw',
              width: '460px',
              overflowX: 'auto',
              color: '#92400e'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: 700,
                outline: 'none',
                color: '#b45309'
              }}>
                तकनीकी विवरण / Technical Details
              </summary>
              <pre style={{
                marginTop: '0.75rem',
                padding: '0.5rem',
                background: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid #fcd34d',
                color: '#b45309',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.4,
                fontSize: '0.72rem'
              }}>
                {this.state.error?.toString() || 'Unknown error'}
                {this.state.errorInfo?.componentStack && `\n\nComponent Stack:${this.state.errorInfo.componentStack}`}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
