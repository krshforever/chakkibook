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
    console.error("Uncaught React Error in Chakkibook:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
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
          fontFamily: "'Inter', system-ui, sans-serif",
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3.5rem',
            marginBottom: '1rem'
          }}>
            🌾
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#b45309',
            marginBottom: '0.5rem'
          }}>
            Oops! Chakkibook Screen Refresh Ki Zaroorat Hai
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#92400e',
            maxWidth: '380px',
            lineHeight: 1.5,
            marginBottom: '1.5rem'
          }}>
            Koi chhota sa technical error aaya hai. Kripya niche diye gaye button par click karke screen reload karein.
          </p>
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
              boxShadow: '0 6px 16px rgba(217, 119, 6, 0.35)'
            }}
          >
            🔄 Refresh & Reload Screen
          </button>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details style={{ marginTop: '2rem', textAlign: 'left', background: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', maxWidth: '90vw', overflowX: 'auto' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Error Details</summary>
              <pre style={{ marginTop: '0.5rem' }}>{this.state.error.toString()}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
