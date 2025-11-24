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


const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
