// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfV9fSMoarZeYBG3zPyXzP6fFH9VZF_x8",
  authDomain: "student-e-portfolio-69878.firebaseapp.com",
  projectId: "student-e-portfolio-69878",
  storageBucket: "student-e-portfolio-69878.firebasestorage.app",
  messagingSenderId: "20519374952",
  appId: "1:20519374952:web:fc71f78f1c52f788512bdd",
  measurementId: "G-GZHHXK33M0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Cloud Firestore Database
export const db = getFirestore(app);

// Google Login
export const googleProvider = new GoogleAuthProvider();

// Analytics (optional)
if (typeof window !== "undefined") {
  getAnalytics(app);
}