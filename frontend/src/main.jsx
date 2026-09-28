import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Exposed so the currently-served build can be checked from the browser console
// (window.__SIRI_BUILD__) — useful for confirming a deploy actually reached
// visitors, especially right after a domain/account move.
window.__SIRI_BUILD__ = 'a46f8fc';

// Handle dynamic import / chunk load failures automatically when a new build is deployed
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite chunk preload error detected. Reloading page for latest bundle version...', event);
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
