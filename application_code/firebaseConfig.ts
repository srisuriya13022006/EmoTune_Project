// Import Firebase modules
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTiYN6TOEj9f_f7bOaubtiHyU_BuXrXiA",
  authDomain: "ematune.firebaseapp.com",
  projectId: "ematune",
  storageBucket: "ematune.firebasestorage.app",
  messagingSenderId: "286716238268",
  appId: "1:286716238268:web:c0e43d77f3cf9a4fb733b9"
};

// Initialize Firebase (Avoid duplicate initialization)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
