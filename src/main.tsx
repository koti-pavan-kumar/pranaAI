import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      () => {
        console.log('[PWA] SW registered — pre-caching all pages');
        // Pre-load ALL lazy chunks to trigger caching
        Promise.all([
          import('./pages/Landing'),
          import('./pages/Home'),
          import('./pages/Breathing'),
          import('./pages/Journal'),
          import('./pages/Dashboard'),
          import('./pages/Chat'),
          import('./pages/Emergency'),
          import('./pages/CameraBreathing'),
          import('./pages/Telemetry'),
          import('./pages/Login'),
          import('./pages/Register'),
        ]).then(() => {
          console.log('[PWA] All chunks pre-cached for offline use!');
          // Also pre-cache the CSS and other assets
          if ('caches' in window) {
            caches.open('pranaai-v9').then(cache => {
              cache.add('/').catch(() => {});
              cache.add('/index.html').catch(() => {});
            });
          }
        });
      },
      (err) => console.log('[PWA] SW failed:', err)
    );
  });
}

window.addEventListener('error', (e) => console.error('[Error]', e.error));
window.addEventListener('unhandledrejection', (e) => console.error('[Promise]', e.reason));

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
