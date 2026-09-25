import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error captured by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      const errMsg = (this.state.error?.message || '').toLowerCase();
      const errName = (this.state.error?.name || '').toLowerCase();

      const isChunkError =
        errName === 'chunkloaderror' ||
        errMsg.includes('loading chunk') ||
        errMsg.includes('dynamically imported module') ||
        errMsg.includes('failed to fetch dynamically imported') ||
        errMsg.includes('importing a module script failed') ||
        errMsg.includes('failed to load resource');

      if (isChunkError) {
        const reloadKey = 'chunk_reload_' + window.location.pathname;
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, 'true');
          window.location.reload();
          return null;
        }
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9F6F0',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '36px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            textAlign: 'center',
            border: '1px solid #E5E0D8'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 20px'
            }}>
              ⚠️
            </div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#1C4B12',
              margin: '0 0 10px'
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#687466',
              margin: '0 0 24px',
              lineHeight: 1.5
            }}>
              An unexpected error occurred while loading this view. Please try refreshing or return to the main dashboard.
            </p>
            {this.state.error?.message && (
              <div style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#4B5563',
                fontFamily: 'monospace',
                marginBottom: '24px',
                textAlign: 'left',
                overflowX: 'auto',
                maxHeight: '100px'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#1C4B12',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Return to Store
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
