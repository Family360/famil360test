// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import "./firebase";
import { validateEnvironment } from "./utils/envCheck"; // FIXED: Use ./ for same directory

// Initialize environment validation
try {
  validateEnvironment();
  console.log("✅ Environment validation passed");
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

if (!Capacitor.isNativePlatform()) {
  console.log("🔥 Firebase initialized for Web");
} else {
  console.log("📱 Running on native (Firebase handled via Capacitor Google Services)");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);