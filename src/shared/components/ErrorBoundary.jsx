import React from 'react';

/**
 * Catches render/runtime errors in the subtree so a single failing screen does not
 * white-screen the whole POS. Shows a friendly message (no stack trace to the user)
 * and a recovery action. In development the error text is shown to aid debugging.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Kept for real error reporting later; stripped from production builds by esbuild.drop.
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = import.meta.env.DEV;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
        padding: '2rem', textAlign: 'center', fontFamily: 'Inter, sans-serif',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Something went wrong</h2>
        <p style={{ color: '#555', maxWidth: 480 }}>
          This screen ran into an unexpected error. Your work in progress may be safe.
          Try again, or reload the page.
        </p>
        {isDev && this.state.error && (
          <pre style={{
            maxWidth: 640, overflow: 'auto', background: '#f5f5f5',
            padding: '0.75rem', borderRadius: 8, fontSize: '0.75rem', textAlign: 'left',
          }}>{String(this.state.error?.stack || this.state.error)}</pre>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={this.handleReset} style={{
            padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer',
          }}>Try again</button>
          <button onClick={() => window.location.reload()} style={{
            padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
            background: '#111', color: '#fff', cursor: 'pointer',
          }}>Reload</button>
        </div>
      </div>
    );
  }
}
