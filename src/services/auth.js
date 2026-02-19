/**
 * Auth Service
 * Firebase Authentication for admin/protected pages
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase Configuration (same as firebase.js)
const firebaseConfig = {
    apiKey: "AIzaSyAmZLDH2V9JTHB2ZiHZdRcv0yO07MQVaM0",
    authDomain: "refernconnect-953b0.firebaseapp.com",
    projectId: "refernconnect-953b0",
    storageBucket: "refernconnect-953b0.firebasestorage.app",
    messagingSenderId: "9614706593",
    appId: "1:9614706593:web:48d0ac91bf301f90ea6de0"
};

// Use existing app if already initialized, otherwise initialize
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

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
 */
export const getCurrentUser = () => auth.currentUser;
