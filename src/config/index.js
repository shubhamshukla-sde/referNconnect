/**
 * Application Configuration
 * Central configuration for the entire application
 */

// Firebase Configuration
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAl3T9L7bEy4I3DFHtVEJNSfQxjI2N3VXw",
    authDomain: "refernconnect.firebaseapp.com",
    projectId: "refernconnect",
    storageBucket: "refernconnect.firebasestorage.app",
    messagingSenderId: "619943821912",
    appId: "1:619943821912:web:7f0c0d6f5c3a5d8e9f1a2b"
};

// API Endpoints
export const API = {
    PERPLEXITY: 'https://api.perplexity.ai/chat/completions',
    PERPLEXITY_MODEL: 'sonar'
};

// Local Storage Keys
export const STORAGE_KEYS = {
    COMPANIES: 'referNconnect_companies',
    API_KEY: 'perplexity_api_key'
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
    API,
    STORAGE_KEYS,
    FIELD_MAPPINGS,
    UI,
    ERRORS
};
