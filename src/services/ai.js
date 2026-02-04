/**
 * AI Service
 * Handles Perplexity AI integration for intelligent data parsing
 */

import { API, STORAGE_KEYS } from '../config/index.js';
import { generateId } from '../utils/helpers.js';

/**
 * Get stored API key
 * @returns {string} API key or empty string
 */
export const getApiKey = () => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
};

/**
 * Save API key to localStorage
 * @param {string} key - API key to save
 */
export const saveApiKey = (key) => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
};

/**
 * Parse data using Perplexity AI
 * @param {string} rawData - Raw input data
 * @param {string} dataType - Type of data: 'text', 'csv', or 'json'
 * @returns {Promise<Array>} Structured company/employee data
 */
export const parseWithAI = async (rawData, dataType = 'text') => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Perplexity API key not configured');
    }

    const systemPrompt = `You are a data extraction assistant. Extract employee and company information from the provided data and return it as a structured JSON array.

EXTRACTION RULES:
1. Extract ALL employees mentioned in the input
2. ALWAYS extract phone numbers when present (format: include country code if available)
3. Identify company from context clues like email domain, company name, or explicit mentions
4. If company cannot be determined, use "N/A" as company name

EMPLOYEE FIELDS TO EXTRACT:
- firstName: First name
- lastName: Last name  
- email: Email address
- phone: Phone number with country code (IMPORTANT: do not miss this!)
- jobTitle: Job title/position
- linkedin: LinkedIn profile URL
- location: City, State, Country

COMPANY FIELDS TO EXTRACT:
- name: Company name
- domain: Company website domain (e.g., adobe.com)
- industry: Industry sector (e.g., Software Development)
- size: Employee count (e.g., "121K" or "10000")
- type: Company type (Public/Private)
- headquarters: HQ location
- linkedin: Company LinkedIn URL

OUTPUT FORMAT (return ONLY this JSON, no other text):
[
  {
    "name": "Company Name",
    "domain": "company.com",
    "industry": "Software Development",
    "size": "121K",
    "type": "Public",
    "headquarters": "San Jose, USA",
    "linkedin": "https://linkedin.com/company/example",
    "employees": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@company.com",
        "phone": "+1 555-123-4567",
        "jobTitle": "Software Engineer",
        "linkedin": "https://linkedin.com/in/johndoe",
        "location": "New York, USA"
      }
    ]
  }
]`;

    const userPrompt = `Extract employee and company data from this ${dataType.toUpperCase()} input and return structured JSON:

${rawData}`;

    try {
        const response = await fetch(API.PERPLEXITY, {
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
                temperature: 0.1,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        const parsedData = extractAndParseJSON(content);
        return normalizeData(parsedData);
    } catch (error) {
        console.error('AI parsing error:', error);
        throw error;
    }
};

/**
 * Extract and parse JSON from AI response with robust error handling
 * @param {string} content - Raw AI response content
 * @returns {Array} Parsed JSON array
 */
const extractAndParseJSON = (content) => {
    // Remove markdown code blocks if present
    let cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Try to find JSON array
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Could not extract JSON array from AI response');
    }

    let jsonStr = jsonMatch[0];

    // Fix common JSON issues from AI responses
    jsonStr = jsonStr
        .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas
        .replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"')  // Fix newlines in strings
        .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control characters
        .replace(/""\s*:/g, '":')
        .replace(/:\s*""/g, ': ""');

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.warn('Initial JSON parse failed, attempting aggressive cleanup...');

        // Try to extract individual objects and rebuild array
        const objectMatches = jsonStr.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (objectMatches && objectMatches.length > 0) {
            const objects = [];
            for (const objStr of objectMatches) {
                try {
                    objects.push(JSON.parse(objStr));
                } catch {
                    // Skip malformed objects
                }
            }
            if (objects.length > 0) {
                return objects;
            }
        }

        throw new Error('Could not parse AI response as JSON: ' + e.message);
    }
};

/**
 * Normalize and validate parsed data
 * @param {Array} data - Raw parsed data
 * @returns {Array} Normalized company array
 */
const normalizeData = (data) => {
    if (!Array.isArray(data)) {
        throw new Error('Expected array of companies');
    }

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

export default {
    getApiKey,
    saveApiKey,
    parseWithAI
};
