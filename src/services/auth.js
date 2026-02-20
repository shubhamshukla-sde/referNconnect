/**
 * @module Auth Service
 * Firebase Authentication for admin/protected pages.
 * Uses shared Firebase config from config/index.js.
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

import { FIREBASE_CONFIG } from '../config/index.js';

// Reuse existing app if already initialized (prevents duplicate-app crashes)
const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const signInAdmin = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign out
 * @returns {Promise<void>}
 */
export const signOutAdmin = () => {
    return signOut(auth);
};

/**
 * Listen for auth state changes
 * @param {Function} callback - receives (user) or (null)
 * @returns {Function} unsubscribe function
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Get current user (synchronous, may be null on first load)
 * @returns {import('firebase/auth').User | null}
 */
export const getCurrentUser = () => auth.currentUser;
