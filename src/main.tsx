// src/main.tsx - Enhanced Application Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import webrtc-adapter for cross-browser compatibility
import 'webrtc-adapter';

// Performance monitoring
if (import.meta.env.DEV) {
  // Log performance metrics in development
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      console.log('⚡ Performance Metrics:', {
        'DOM Content Loaded': `${Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart)}ms`,
        'Load Complete': `${Math.round(perfData.loadEventEnd - perfData.loadEventStart)}ms`,
        'Total Load Time': `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`,
      });
    }, 0);
  });
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // In production, send to error reporting service
});

// Check for WebRTC support
const checkWebRTCSupport = () => {
  const hasWebRTC = !!(
    window.RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
  
  const hasGetUserMedia = !!(
    navigator.mediaDevices?.getUserMedia ||
    navigator.getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia
  );
  
  if (!hasWebRTC || !hasGetUserMedia) {
    console.error('WebRTC is not supported in this browser');
    return false;
  }
  
  return true;
};

// Initialize app
const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

// Check WebRTC support before rendering
if (!checkWebRTCSupport()) {
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to bottom right, #1f2937, #111827);
      color: white;
      font-family: sans-serif;
      padding: 2rem;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">WebRTC Not Supported</h1>
        <p style="color: #9ca3af; margin-bottom: 2rem;">
          Your browser doesn't support WebRTC technology required for video calls.
        </p>
        <p style="color: #6b7280;">
          Please use a modern browser like Chrome, Firefox, Safari, or Edge.
        </p>
      </div>
    </div>
  `;
} else {
  // Render the app
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Register service worker for PWA support (optional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.log('Service worker registration failed:', error);
    });
  });
}
