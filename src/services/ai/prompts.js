/**
 * @module AI Prompts
 * High-level AI use-cases: data parsing, job search, and resume analysis.
 * Each function builds a system+user prompt and delegates to callAI.
 */

import { callAI } from './providers.js';
import { extractAndParseJSON, normalizeData, extractJobSearchJSON, extractResumeJSON } from './parsers.js';

// ─── Data Parsing ─────────────────────────────────────────────

/**
 * Parse raw input data using AI into structured company/employee format.
 * @param {string} rawData - Raw input data (CSV, JSON, or plain text)
 * @param {string} [dataType='text'] - Type hint: 'text', 'csv', or 'json'
 * @returns {Promise<Array>} Normalized array of company objects with employees
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
 * Search for recent job posts for a company using AI-generated Google search links.
 * @param {string} companyName
 * @param {string} [location=''] - Optional location filter
 * @param {string} [timeRange='month'] - 'week', 'month', 'quarter', 'year', or 'all'
 * @returns {Promise<Object>} Job search results with search links
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
 * Parse resume text to extract skills, experience, and education.
 * @param {string} resumeText - Full text content of a resume
 * @returns {Promise<Object>} Structured resume data
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
 * Search for jobs matching a candidate's resume skills at a specific company.
 * @param {string} companyName
 * @param {Array<string>} skills - Candidate's skills list
 * @param {string} [candidateLocation=''] - Candidate's location
 * @param {string} [timeRange='month'] - Time filter
 * @returns {Promise<Object>} Job search results with match info
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
