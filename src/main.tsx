import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// NUCLEAR: Unregister ALL service workers and never re-register
// This ensures no stale cache can ever cause a white screen
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  // Also clear all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}

// Global error handler — catch any uncaught error and show something
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;padding:20px;font-family:system-ui">
      <div style="background:white;border-radius:16px;padding:32px;max-width:400px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        <h2 style="color:#0f172a;margin-bottom:8px">Loading PranaAI...</h2>
        <p style="color:#64748b;font-size:14px">Please refresh the page. If this persists, clear your browser cache.</p>
        <button onclick="window.location.reload()" style="margin-top:16px;padding:10px 24px;background:#14b8a6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Refresh</button>
      </div>
    </div>
  `;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise]', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
