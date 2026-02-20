/**
 * @module AI Key Management
 * Handles storage and retrieval of API keys for AI providers,
 * plus resume data persistence in localStorage.
 */

import { STORAGE_KEYS } from '../../config/index.js';

// ─── Perplexity API Key ───────────────────────────────────────

/** @returns {string} Stored Perplexity API key or empty string */
export const getApiKey = () => localStorage.getItem(STORAGE_KEYS.API_KEY) || '';

/** @param {string} key - Perplexity API key to save */
export const saveApiKey = (key) => localStorage.setItem(STORAGE_KEYS.API_KEY, key);

// ─── Gemini API Key ───────────────────────────────────────────

/** @returns {string} Stored Gemini API key or empty string */
export const getGeminiKey = () => localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '';

/** @param {string} key - Gemini API key to save */
export const saveGeminiKey = (key) => localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);

// ─── Active Provider Detection ────────────────────────────────

/**
 * Get the currently active AI provider based on stored keys.
 * Perplexity (paid) takes priority over Gemini (free).
 * @returns {{ provider: string, key: string } | null}
 */
export const getActiveProvider = () => {
    const pKey = getApiKey();
    if (pKey) return { provider: 'perplexity', key: pKey };
    const gKey = getGeminiKey();
    if (gKey) return { provider: 'gemini', key: gKey };
    return null;
};

// ─── Resume Data Storage ──────────────────────────────────────

/** @param {Object} resumeData - Parsed resume data to persist */
export const saveResumeData = (resumeData) =>
    localStorage.setItem('resumeData', JSON.stringify(resumeData));

/** @returns {Object|null} Stored resume data or null */
export const getResumeData = () => {
    const d = localStorage.getItem('resumeData');
    return d ? JSON.parse(d) : null;
};

/** Remove stored resume data */
export const clearResumeData = () => localStorage.removeItem('resumeData');
