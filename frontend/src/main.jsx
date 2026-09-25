import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

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
