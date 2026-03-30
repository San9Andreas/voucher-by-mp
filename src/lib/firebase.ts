/// <reference types="vite/client" />
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

// ============================================================
//  🔧 FIREBASE CONFIGURATION
//
//  To connect to Firestore + Google Auth, create a .env file
//  in the project root with the following variables from your
//  Firebase Console:
//
//  VITE_FIREBASE_API_KEY=AIzaSyAKT7FxlX54wCBQPxecFv7VyEepezR1zYU
//  VITE_FIREBASE_AUTH_DOMAIN=mp-sport-app.firebaseapp.com
//  VITE_FIREBASE_PROJECT_ID=mp-sport-app
//  VITE_FIREBASE_STORAGE_BUCKET=mp-sport-app.firebasestorage.app
//  VITE_FIREBASE_MESSAGING_SENDER_ID=255713685153
//  VITE_FIREBASE_APP_ID=1:255713685153:web:6375ed04ff20eeedf24ae0
//  Or replace the values directly below.
// ============================================================

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyAKT7FxlX54wCBQPxecFv7VyEepezR1zYU',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'mp-sport-app.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'mp-sport-app',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'mp-sport-app.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '255713685153',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:255713685153:web:6375ed04ff20eeedf24ae0',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let firebaseError: string | null = null;

// Check if Firebase is configured (has a project ID)
const isConfigured = !!firebaseConfig.projectId && firebaseConfig.projectId !== '';

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    firebaseError = err instanceof Error ? err.message : 'Failed to initialize Firebase';
    console.error('Firebase initialization error:', firebaseError);
  }
} else {
  firebaseError = 'Firebase not configured — using local storage. Add VITE_FIREBASE_* env vars to enable Firestore & Google Auth.';
  console.info(firebaseError);
}

export { app, db, auth, googleProvider, firebaseError, isConfigured };
export const INVOICES_COLLECTION = 'invoices';
export const USERS_COLLECTION = 'users';
