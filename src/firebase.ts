// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ----------------------
// 🔑 Firebase Web Project Configuration from Env Vars
// ----------------------
const firebaseConfig = {
  apiKey: "AIzaSyD3CWGK0xb_vboRoxuHSCFsvzmi_Evp_Sk",
  authDomain: "foodcart360-a8453.firebaseapp.com",
  projectId: "foodcart360-a8453",
  storageBucket: "foodcart360-a8453.appspot.com", // Updated to match env var
  messagingSenderId: "584492441445",
  appId: "1:584492441445:web:28ad4b33f86a8dd033cb8c",
};

// ----------------------
// Initialize Firebase App
// ----------------------
const app = initializeApp(firebaseConfig);

// ----------------------
// Initialize Firebase Auth
// ----------------------
export const auth = getAuth(app);

// ----------------------
// Export Firebase App
// ----------------------
export default app;