/**
 * AI Service
 * Handles AI integration with dual provider support:
 * - Perplexity AI (primary, if key provided)
 * - Google Gemini (fallback / free tier)
 */

import { API, STORAGE_KEYS } from '../config/index.js';
import { generateId } from '../utils/helpers.js';

// ─── API Key Management ───────────────────────────────────────

/** Get Perplexity API key */
export const getApiKey = () => localStorage.getItem(STORAGE_KEYS.API_KEY) || '';

/** Save Perplexity API key */
export const saveApiKey = (key) => localStorage.setItem(STORAGE_KEYS.API_KEY, key);

/** Get Gemini API key */
export const getGeminiKey = () => localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '';

/** Save Gemini API key */
export const saveGeminiKey = (key) => localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);

/**
 * Get active AI provider info
 * @returns {{ provider: string, key: string } | null}
 */
export const getActiveProvider = () => {
    const pKey = getApiKey();
    if (pKey) return { provider: 'perplexity', key: pKey };
    const gKey = getGeminiKey();
    if (gKey) return { provider: 'gemini', key: gKey };
    return null;
};

// ─── Unified AI Caller ────────────────────────────────────────

/**
 * Call AI with automatic provider selection
 * Perplexity if key exists, else Gemini, else error
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ temperature?: number, maxTokens?: number }} opts
 * @returns {Promise<string>} Raw text response from AI
 */
const callAI = async (systemPrompt, userPrompt, opts = {}) => {
    const { temperature = 0.1, maxTokens = 4096 } = opts;
    const pKey = getApiKey();
    const gKey = getGeminiKey();

    if (!pKey && !gKey) {
        throw new Error('No API key configured. Please add a Perplexity or Gemini API key in Admin settings.');
    }

    // Try Perplexity first, auto-fallback to Gemini on failure
    if (pKey) {
        try {
            return await callPerplexity(systemPrompt, userPrompt, pKey, temperature, maxTokens);
        } catch (err) {
            if (gKey) {
                console.warn('Perplexity failed, falling back to Gemini:', err.message);
                return callGemini(systemPrompt, userPrompt, gKey, temperature, maxTokens);
            }
            throw err;
        }
    }

    return callGemini(systemPrompt, userPrompt, gKey, temperature, maxTokens);
};

/**
 * Call Perplexity API
 */
const callPerplexity = async (systemPrompt, userPrompt, apiKey, temperature, maxTokens) => {
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
 * Call Google Gemini API
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

// ─── Data Parsing ─────────────────────────────────────────────

/**
 * Parse data using AI (Perplexity or Gemini)
 * @param {string} rawData - Raw input data
 * @param {string} dataType - 'text', 'csv', or 'json'
 * @returns {Promise<Array>} Structured company/employee data
 */
export const parseWithAI = async (rawData, dataType = 'text') => {
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

    const userPrompt = `Extract employee and company data from this ${dataType.toUpperCase()} input and return structured JSON:\n\n${rawData}`;

    try {
        const content = await callAI(systemPrompt, userPrompt, { temperature: 0.1, maxTokens: 4096 });
        const parsedData = extractAndParseJSON(content);
        return normalizeData(parsedData);
    } catch (error) {
        console.error('AI parsing error:', error);
        throw error;
    }
};

// ─── Job Search ───────────────────────────────────────────────

/**
 * Search for recent job posts for a company
 * @param {string} companyName
 * @param {string} location
 * @param {string} timeRange - week, month, quarter, year, all
 * @returns {Promise<Object>}
 */
export const searchJobPosts = async (companyName, location = '', timeRange = 'month') => {
    const encodedCompany = encodeURIComponent(companyName);
    const encodedLocation = location ? encodeURIComponent(location) : '';

    const timeFilters = {
        week: '&tbs=qdr:w', month: '&tbs=qdr:m',
        quarter: '&tbs=qdr:m3', year: '&tbs=qdr:y', all: ''
    };
    const timeFilter = timeFilters[timeRange] || timeFilters.month;
    const timeLabel = { week: 'This Week', month: 'This Month', quarter: 'This Quarter', year: 'This Year', all: 'All Time' }[timeRange] || 'This Month';

    const systemPrompt = `You are a job search assistant. Create Google search URLs to find LinkedIn job posts.

Generate URLs with these patterns:
- Base: https://www.google.com/search?q=SEARCH_TERMS${timeFilter}
- The ${timeFilter ? `"${timeFilter}"` : 'no'} parameter filters results to ${timeLabel.toLowerCase()}

OUTPUT FORMAT (return ONLY this JSON):
{
  "company": "${companyName}",
  "searchLinks": [
    {
      "title": "Search title",
      "description": "Brief description",
      "googleSearchUrl": "https://www.google.com/search?q=...",
      "icon": "emoji"
    }
  ],
  "hiringStatus": "Check search results"
}`;

    const userPrompt = `Create Google search links for ${companyName} jobs:

1. LinkedIn Jobs (${timeLabel}): site:linkedin.com/jobs+${encodedCompany}${encodedLocation ? `+${encodedLocation}` : ''}
2. "We're hiring" posts: site:linkedin.com+${encodedCompany}+"hiring"
3. Referral posts: site:linkedin.com+${encodedCompany}+referral
${location ? `4. Jobs in ${location}: site:linkedin.com/jobs+${encodedCompany}+${encodedLocation}
5. Naukri ${location}: site:naukri.com+${encodedCompany}+${encodedLocation}` : `4. Naukri jobs: site:naukri.com+${encodedCompany}`}
6. Careers page: ${encodedCompany}+careers+jobs

Add time filter "${timeFilter}" for ${timeLabel} results. Make URLs clickable.`;

    try {
        const content = await callAI(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 2048 });
        return extractJobSearchJSON(content);
    } catch (error) {
        console.error('Job search error:', error);
        throw error;
    }
};

// ─── Resume Parsing ───────────────────────────────────────────

/**
 * Parse resume text to extract skills and experience
 * @param {string} resumeText
 * @returns {Promise<Object>}
 */
export const parseResume = async (resumeText) => {
    const systemPrompt = `You are a resume parser and job market expert. Extract skills from the resume and identify the most in-demand ones.

OUTPUT FORMAT (return ONLY this JSON, no other text):
{
  "allSkills": ["skill1", "skill2", ...],
  "topSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Software Engineer",
      "company": "Company Name",
      "location": "City",
      "years": 2
    }
  ],
  "education": ["BS Computer Science"],
  "currentLocation": "City where candidate currently works/lives",
  "totalYearsExperience": 5,
  "summary": "Brief 1-line summary"
}

INSTRUCTIONS:
1. Extract approximately 10-12 technical skills from the resume (allSkills)
2. From those, pick the TOP 5 most in-demand skills based on current job market (topSkills)
   - Prioritize skills with highest number of job openings (e.g., Python, JavaScript, React, AWS, SQL)
   - Consider skills that are trending in 2024-2026
   - Avoid niche or outdated technologies for topSkills
3. The "skills" array should be same as "allSkills" for backward compatibility
4. Extract current location from the resume (most recent job or address)`;

    const userPrompt = `Parse this resume. Extract about 10-12 skills, then identify the TOP 5 most job-market-demanded skills from those:\n\n${resumeText}`;

    try {
        const content = await callAI(systemPrompt, userPrompt, { temperature: 0.1, maxTokens: 2048 });
        return extractResumeJSON(content);
    } catch (error) {
        console.error('Resume parsing error:', error);
        throw error;
    }
};

// ─── Job Search with Resume ───────────────────────────────────

/**
 * Search for jobs matching resume skills
 * @param {string} companyName
 * @param {Array} skills
 * @param {string} candidateLocation
 * @param {string} timeRange
 * @returns {Promise<Object>}
 */
export const searchJobsWithResume = async (companyName, skills, candidateLocation = '', timeRange = 'month') => {
    const skillsList = skills.slice(0, 10).join(', ');
    const topSkills = skills.slice(0, 5).join('+');
    const encodedCompany = encodeURIComponent(companyName);
    const encodedLocation = candidateLocation ? encodeURIComponent(candidateLocation) : '';

    const timeFilters = {
        week: '&tbs=qdr:w', month: '&tbs=qdr:m',
        quarter: '&tbs=qdr:m3', year: '&tbs=qdr:y', all: ''
    };
    const timeFilter = timeFilters[timeRange] || '&tbs=qdr:m';

    const systemPrompt = `You are a job search assistant. Generate optimized Google search links to find LinkedIn jobs matching the candidate's skills at the specified company.

CANDIDATE SKILLS: ${skillsList}
${candidateLocation ? `CANDIDATE LOCATION: ${candidateLocation}` : ''}

Create Google search URLs that will find relevant LinkedIn content. Each URL should be properly formatted like:
https://www.google.com/search?q=SEARCH_TERMS

OUTPUT FORMAT (return ONLY this JSON, no other text):
{
  "company": "${companyName}",
  "candidateLocation": "${candidateLocation || 'Unknown'}",
  "candidateSkills": ${JSON.stringify(skills.slice(0, 10))},
  "searchLinks": [
    {
      "title": "Jobs matching your skills at ${companyName}",
      "description": "LinkedIn jobs with ${skills[0] || 'your skills'}",
      "googleSearchUrl": "https://www.google.com/search?q=site:linkedin.com/jobs+${encodedCompany}+${topSkills}",
      "icon": "💼",
      "location": "${candidateLocation || 'All locations'}",
      "distanceKm": 0
    },
    {
      "title": "Hiring posts from ${companyName} employees",
      "description": "We're hiring posts mentioning your skills",
      "googleSearchUrl": "https://www.google.com/search?q=site:linkedin.com+${encodedCompany}+hiring+${encodeURIComponent(skills[0] || '')}",
      "icon": "📢",
      "location": "${candidateLocation || 'All'}",
      "distanceKm": 0
    },
    {
      "title": "Referral opportunities at ${companyName}",
      "description": "Employees looking to refer candidates",
      "googleSearchUrl": "https://www.google.com/search?q=site:linkedin.com+${encodedCompany}+referral+${encodedLocation}",
      "icon": "🤝",
      "location": "${candidateLocation || 'All'}",
      "distanceKm": 0
    },
    ${candidateLocation ? `{
      "title": "Jobs in ${candidateLocation}",
      "description": "Positions at ${companyName} near you",
      "googleSearchUrl": "https://www.google.com/search?q=site:linkedin.com/jobs+${encodedCompany}+${encodedLocation}",
      "icon": "📍",
      "location": "${candidateLocation}",
      "distanceKm": 0
    },` : ''}
    {
      "title": "${companyName} on Naukri.com",
      "description": "Jobs on India's top job portal",
      "googleSearchUrl": "https://www.google.com/search?q=site:naukri.com+${encodedCompany}+${topSkills}",
      "icon": "🇮🇳",
      "location": "India",
      "distanceKm": 0
    }
  ],
  "hiringStatus": "Check the search results for current openings"
}

Make the search queries specific to the candidate's skills. Include skill keywords in search URLs where relevant.`;

    const userPrompt = `Create Google search links to find ${companyName} jobs matching these skills: ${skillsList}
${candidateLocation ? `\nCandidate is in ${candidateLocation}.` : ''}

Include searches for:
1. LinkedIn Jobs with skill keywords
2. Employee hiring posts
3. Referral requests
${candidateLocation ? `4. Jobs in ${candidateLocation}` : ''}
5. Naukri.com jobs`;

    try {
        const content = await callAI(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 3000 });
        return extractJobSearchJSON(content);
    } catch (error) {
        console.error('Job search with resume error:', error);
        throw error;
    }
};

// ─── JSON Parsing Helpers ─────────────────────────────────────

const extractAndParseJSON = (content) => {
    let cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Could not extract JSON array from AI response');
    }

    let jsonStr = jsonMatch[0]
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"')
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/""\s*:/g, '":')
        .replace(/:\s*""/g, ': ""');

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

const normalizeData = (data) => {
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

const extractJobSearchJSON = (content) => {
    let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { company: '', jobPosts: [], hiringStatus: 'Unknown', notes: 'Could not parse response' };
    try { return JSON.parse(jsonMatch[0]); }
    catch (e) { console.warn('Job search JSON parse failed:', e); return { company: '', jobPosts: [], hiringStatus: 'Unknown', notes: 'Could not parse response' }; }
};

const extractResumeJSON = (content) => {
    let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { skills: [], experience: [], education: [], totalYearsExperience: 0, summary: '' };
    try { return JSON.parse(jsonMatch[0]); }
    catch (e) { console.warn('Resume JSON parse failed:', e); return { skills: [], experience: [], education: [], totalYearsExperience: 0, summary: '' }; }
};

// ─── Resume Storage ───────────────────────────────────────────

export const saveResumeData = (resumeData) => localStorage.setItem('resumeData', JSON.stringify(resumeData));
export const getResumeData = () => { const d = localStorage.getItem('resumeData'); return d ? JSON.parse(d) : null; };
export const clearResumeData = () => localStorage.removeItem('resumeData');

export default {
    getApiKey, saveApiKey, getGeminiKey, saveGeminiKey, getActiveProvider,
    parseWithAI, searchJobPosts, parseResume, searchJobsWithResume,
    saveResumeData, getResumeData, clearResumeData
};
