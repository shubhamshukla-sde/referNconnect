/**
 * @module AI Providers
 * Handles the actual HTTP calls to AI providers (Perplexity, Gemini)
 * with automatic bidirectional fallback.
 */

import { API } from '../../config/index.js';
import { getApiKey, getGeminiKey } from './keys.js';

// ─── Provider Implementations ─────────────────────────────────

/**
 * Call Perplexity API via local proxy to avoid CORS issues.
 * In development, calls go through /api/perplexity on our server.
 * The proxy forwards them to https://api.perplexity.ai/chat/completions.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} apiKey
 * @param {number} temperature
 * @param {number} maxTokens
 * @returns {Promise<string>} Raw text response
 */
const callPerplexity = async (systemPrompt, userPrompt, apiKey, temperature, maxTokens) => {
    const proxyUrl = `${window.location.origin}/api/perplexity`;

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: API.PERPLEXITY_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Perplexity API error (${response.status})`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
};

/**
 * Call Google Gemini API directly (supports browser CORS).
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} apiKey
 * @param {number} temperature
 * @param {number} maxTokens
 * @returns {Promise<string>} Raw text response
 */
const callGemini = async (systemPrompt, userPrompt, apiKey, temperature, maxTokens) => {
    const url = `${API.GEMINI}?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [{
                parts: [{ text: userPrompt }]
            }],
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens
            }
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg = error.error?.message || `Gemini API error (${response.status})`;
        throw new Error(msg);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// ─── Unified AI Caller ────────────────────────────────────────

/**
 * Call AI with automatic provider selection and bidirectional fallback.
 * Priority: Perplexity (paid) → Gemini (free).
 * If the first provider fails, the next is tried automatically.
 *
 * @param {string} systemPrompt - System/instruction prompt
 * @param {string} userPrompt - User/content prompt
 * @param {{ temperature?: number, maxTokens?: number }} [opts] - Generation options
 * @returns {Promise<string>} Raw text response from the first successful provider
 * @throws {Error} If all providers fail
 */
export const callAI = async (systemPrompt, userPrompt, opts = {}) => {
    const { temperature = 0.1, maxTokens = 4096 } = opts;
    const pKey = getApiKey();
    const gKey = getGeminiKey();

    if (!pKey && !gKey) {
        throw new Error(
            'No API key configured. Please add a Perplexity or Gemini API key in Admin settings.'
        );
    }

    // Build ordered provider list: Perplexity first (paid), Gemini second
    const providers = [];
    if (pKey) providers.push({ name: 'Perplexity', call: () => callPerplexity(systemPrompt, userPrompt, pKey, temperature, maxTokens) });
    if (gKey) providers.push({ name: 'Gemini', call: () => callGemini(systemPrompt, userPrompt, gKey, temperature, maxTokens) });

    let lastError;
    for (const provider of providers) {
        try {
            console.log(`🤖 Trying ${provider.name}...`);
            const result = await provider.call();
            console.log(`✅ ${provider.name} succeeded`);
            return result;
        } catch (err) {
            console.warn(`⚠️ ${provider.name} failed: ${err.message}`);
            lastError = err;
            // Continue to next provider
        }
    }

    // All providers failed
    throw lastError;
};
