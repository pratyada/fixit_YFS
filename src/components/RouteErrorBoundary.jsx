import { Component } from 'react';

// Catches render/runtime errors in a route so a crash shows a recovery screen
// instead of a blank white page (which reads to users as "the page got lost").
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[FIXIT] Route error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '24px',
      }}>
        <div style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.3rem', color: 'var(--color-secondary)' }}>
          Something hiccuped
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', maxWidth: '340px', margin: 0 }}>
          This screen ran into an error, but nothing was lost. Try again, or head back.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button onClick={() => this.setState({ error: null })} style={btn(true)}>Try again</button>
          <button onClick={() => { window.location.href = '/'; }} style={btn(false)}>Go home</button>
        </div>
      </div>
    );
  }
}

const btn = (primary) => ({
  padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
  border: primary ? 'none' : '1px solid var(--color-border)',
  background: primary ? 'var(--color-secondary)' : 'transparent',
  color: primary ? 'white' : 'var(--color-text)',
});
