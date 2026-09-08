import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Force unregister ALL old service workers first, then register fresh one
if ('serviceWorker' in navigator) {
  // Unregister all existing service workers immediately
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.log('[PWA] Unregistering old service worker:', registration.scope);
      registration.unregister();
    }
    
    // Now register the new service worker after a short delay
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[PWA] New service worker registered:', registration.scope);
      }).catch((error) => {
        console.log('[PWA] Service Worker registration failed:', error);
      });
    }, 1000);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
