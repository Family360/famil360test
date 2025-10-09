// src/main.tsx - SIMPLIFIED VERSION (Recommended)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { validateEnvironment } from "./utils/envCheck";
import { initializeApp } from "firebase/app";

// Global Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Global error caught:", error, errorInfo);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 text-red-600 min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="mb-4">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Initialize environment validation
try {
  validateEnvironment();
} catch (error) {
  console.error("❌ Environment validation failed:", error);
  const errorElement = document.createElement('div');
  errorElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fef2f2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui;
    padding: 20px;
    text-align: center;
    z-index: 9999;
  `;
  errorElement.innerHTML = `
    <div>
      <h2>Configuration Error</h2>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p>Please check your environment configuration.</p>
    </div>
  `;
  document.body.appendChild(errorElement);
  throw error;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase with minimal services
if (!Capacitor.isNativePlatform()) {
  const app = initializeApp(firebaseConfig);
  
  // Only disable Analytics (Performance is not imported at all)
  const disableAnalytics = async () => {
    try {
      const { getAnalytics, setAnalyticsCollectionEnabled } = await import("firebase/analytics");
      const analytics = getAnalytics(app);
      setAnalyticsCollectionEnabled(analytics, false);
      console.log("✅ Firebase Analytics disabled - Performance not imported");
    } catch (e) {
      console.warn("Failed to disable analytics:", e);
    }
  };

  disableAnalytics().catch(console.warn);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);