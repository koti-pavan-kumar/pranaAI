import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Register service worker for offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => {
        console.log('[PWA] Service Worker registered');
        // Pre-cache all lazy chunks on first visit
        preloadAllChunks();
      },
      (err) => console.log('[PWA] SW failed:', err)
    );
  });
}

// Pre-load all lazy chunks so they get cached by service worker
function preloadAllChunks() {
  // Import all page chunks in the background
  import('./pages/Landing');
  import('./pages/Home');
  import('./pages/Breathing');
  import('./pages/Journal');
  import('./pages/Dashboard');
  import('./pages/Chat');
  import('./pages/Emergency');
  import('./pages/CameraBreathing');
  import('./pages/Telemetry');
  import('./pages/Login');
  import('./pages/Register');
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise]', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
