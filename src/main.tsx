import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import GlobalErrorBoundary from "./components/shared/GlobalErrorBoundary";

// Global error capture for debugging
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error);
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: e.error?.toString() || e.message,
      stack: e.error?.stack,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    };
    const existingErrors = localStorage.getItem('clientErrors');
    const errors = existingErrors ? JSON.parse(existingErrors) : [];
    errors.push(errorLog);
    if (errors.length > 10) errors.shift();
    localStorage.setItem('clientErrors', JSON.stringify(errors));
  } catch (err) {
    console.error('Failed to log error:', err);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: 'Unhandled Promise Rejection',
      reason: e.reason?.toString(),
      stack: e.reason?.stack,
    };
    const existingErrors = localStorage.getItem('clientErrors');
    const errors = existingErrors ? JSON.parse(existingErrors) : [];
    errors.push(errorLog);
    if (errors.length > 10) errors.shift();
    localStorage.setItem('clientErrors', JSON.stringify(errors));
  } catch (err) {
    console.error('Failed to log rejection:', err);
  }
});

// Register/unregister service worker (avoid caching issues in dev)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Detectar Android WebView y desactivar SW automáticamente (evita cache issues)
    const ua = (navigator.userAgent || '').toLowerCase();
    const isAndroidWebView = /android/.test(ua) && /wv/.test(ua);
    
    if (isAndroidWebView && !localStorage.getItem('DISABLE_SW')) {
      console.log('[SW] Android WebView detectado - desactivando Service Worker automáticamente');
      localStorage.setItem('DISABLE_SW', '1');
    }
    
    // Check if SW is disabled (safe mode for Android debugging)
    const swDisabled = localStorage.getItem('DISABLE_SW') === '1';
    
    if (!swDisabled) {
      window.addEventListener('load', () => {
        let refreshing = false;
        
        // Listen for controller change to reload once
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('New SW controller, reloading...');
            window.location.reload();
          }
        });
        
        navigator.serviceWorker
          .register('/sw.js?v=8')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Handle SW updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Nueva versión disponible. Actualizando...');
                    // Skip waiting to activate new SW immediately
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    } else {
      console.log('SW disabled by DISABLE_SW flag');
    }
  } else {
    // In development, ensure any existing service workers are removed to prevent stale cached chunks
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
      console.log('SW unregistered in development:', regs.length);
    });
    if (window.caches) {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k));
        console.log('Cache cleared in development:', keys);
      });
    }
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
