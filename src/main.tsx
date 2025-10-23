import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register/unregister service worker (avoid caching issues in dev)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js?v=7&ts=' + Date.now())
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Forzar actualización del SW si hay uno nuevo
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nuevo SW disponible, notificar al usuario
                  console.log('Nueva versión disponible. Recarga la página para actualizar.');
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

createRoot(rootElement).render(<App />);
