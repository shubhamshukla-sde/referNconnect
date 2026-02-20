/**
 * @module AI Response Parsers
 * Utilities for extracting and cleaning JSON from raw AI text responses.
 * Each parser is tailored to a specific AI use-case response format.
 */

import { generateId } from '../../utils/helpers.js';

// ─── Company/Employee Data Parser ─────────────────────────────

/**
 * Extract and parse a JSON array from AI response text.
 * Handles markdown code fences, trailing commas, and malformed JSON.
 * @param {string} content - Raw AI response text
 * @returns {Array} Parsed array of objects
 * @throws {Error} If no valid JSON can be extracted
 */
export const extractAndParseJSON = (content) => {
    let cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Could not extract JSON array from AI response');
    }

    let jsonStr = jsonMatch[0]
        .replace(/,\s*([}\]])/g, '$1')          // Remove trailing commas
        .replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"')  // Fix broken strings
        .replace(/[\x00-\x1F\x7F]/g, ' ')       // Remove control chars
        .replace(/""\s*:/g, '":')                // Fix empty-key typos
        .replace(/:\s*""/g, ': ""');             // Normalize empty values

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.warn('Initial JSON parse failed, attempting aggressive cleanup...');
        const objectMatches = jsonStr.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (objectMatches && objectMatches.length > 0) {
            const objects = [];
            for (const objStr of objectMatches) {
                try { objects.push(JSON.parse(objStr)); } catch { /* skip */ }
            }
            if (objects.length > 0) return objects;
        }
        throw new Error('Could not parse AI response as JSON: ' + e.message);
    }
};

/**
 * Normalize raw parsed company data into a consistent schema.
 * Ensures every company and employee has an ID and standard field names.
 * @param {Array} data - Raw parsed company array
 * @returns {Array} Normalized company objects
 * @throws {Error} If data is not an array
 */
export const normalizeData = (data) => {
    if (!Array.isArray(data)) throw new Error('Expected array of companies');

    return data.map(company => ({
        id: generateId(),
        name: company.name || company.companyName || 'N/A',
        domain: company.domain || company.companyDomain || '',
        industry: company.industry || '',
        size: company.size || '',
        type: company.type || '',
        headquarters: company.headquarters || '',
        linkedin: company.linkedin || company.companyLinkedin || '',
        employees: (company.employees || []).map(emp => ({
            id: generateId(),
            firstName: emp.firstName || emp.first_name || '',
            lastName: emp.lastName || emp.last_name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            jobTitle: emp.jobTitle || emp.job_title || emp.title || 'Team Member',
            linkedin: emp.linkedin || '',
            location: emp.location || ''
        }))
    }));
};

// ─── Job Search Parser ────────────────────────────────────────

/**
 * Extract a job search JSON object from AI response text.
 * Returns a safe fallback if parsing fails.
 * @param {string} content - Raw AI response text
 * @returns {Object} Job search data
 */
export const extractJobSearchJSON = (content) => {
    const fallback = { company: '', jobPosts: [], hiringStatus: 'Unknown', notes: 'Could not parse response' };
    let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    try { return JSON.parse(jsonMatch[0]); }
    catch (e) { console.warn('Job search JSON parse failed:', e); return fallback; }
};

// ─── Resume Parser ────────────────────────────────────────────

/**
 * Extract resume data JSON object from AI response text.
 * Returns a safe fallback if parsing fails.
 * @param {string} content - Raw AI response text
 * @returns {Object} Resume data
 */
export const extractResumeJSON = (content) => {
    const fallback = { skills: [], experience: [], education: [], totalYearsExperience: 0, summary: '' };
    let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    try { return JSON.parse(jsonMatch[0]); }
    catch (e) { console.warn('Resume JSON parse failed:', e); return fallback; }
};
