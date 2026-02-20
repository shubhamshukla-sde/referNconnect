/**
 * Application Configuration
 * Central configuration for the entire application
 */

// Firebase Configuration — single source of truth
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAmZLDH2V9JTHB2ZiHZdRcv0yO07MQVaM0",
    authDomain: "refernconnect-953b0.firebaseapp.com",
    projectId: "refernconnect-953b0",
    storageBucket: "refernconnect-953b0.firebasestorage.app",
    messagingSenderId: "9614706593",
    appId: "1:9614706593:web:48d0ac91bf301f90ea6de0",
    measurementId: "G-GTQJ7GLB4Y"
};

// Firebase SDK version — used for CDN imports
export const FIREBASE_VERSION = '10.8.0';

// API Endpoints
export const API = {
    PERPLEXITY: 'https://api.perplexity.ai/chat/completions',
    PERPLEXITY_MODEL: 'sonar',
    GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    GEMINI_MODEL: 'gemini-2.5-flash-lite'
};

// Local Storage Keys
export const STORAGE_KEYS = {
    COMPANIES: 'referNconnect_companies',
    API_KEY: 'perplexity_api_key',
    GEMINI_API_KEY: 'gemini_api_key'
};

// Field Mappings for data normalization
export const FIELD_MAPPINGS = {
    company: {
        'Company name': 'name',
        'Company domain': 'domain',
        'Company industry': 'industry',
        'Company size': 'size',
        'Company type': 'type',
        'Company headquarters': 'headquarters',
        'Company LinkedIn': 'linkedin'
    },
    employee: {
        'First name': 'firstName',
        'Last name': 'lastName',
        'Email': 'email',
        'Phone': 'phone',
        'Job title': 'jobTitle',
        'LinkedIn': 'linkedin',
        'Location': 'location'
    }
};

// UI Constants
export const UI = {
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
    MAX_PREVIEW_EMPLOYEES: 5
};

// Error Messages
export const ERRORS = {
    FIREBASE_NOT_AVAILABLE: 'Firebase connection unavailable',
    API_KEY_MISSING: 'Please enter your Perplexity API key',
    NO_DATA: 'No data to process',
    IMPORT_FAILED: 'Failed to import data',
    SAVE_FAILED: 'Failed to save changes'
};

// Default export for convenience
export default {
    FIREBASE_CONFIG,
    FIREBASE_VERSION,
    API,
    STORAGE_KEYS,
    FIELD_MAPPINGS,
    UI,
    ERRORS
};
