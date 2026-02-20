/**
 * @module Resume Handling
 * Resume file upload, PDF extraction, and resume-based job search coordination.
 */

import {
    getActiveProvider,
    parseResume,
    searchJobsWithResume,
    saveResumeData,
    getResumeData
} from '../services/ai/index.js';

import { renderMatchedJobResults } from './job-results.js';

// ─── Resume File Upload ───────────────────────────────────────

/**
 * Handle resume file upload — supports .txt, .pdf, .doc/.docx (with message).
 * Extracts text content and places it in the resume text input.
 * @param {File} file - Uploaded file
 */
export const handleResumeFile = async (file) => {
    const textInput = document.getElementById('resumeTextInput');

    try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            textInput.value = await file.text();

        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            textInput.value = 'Extracting text from PDF...';
            try {
                if (!window.pdfjsLib) await loadPdfJs();
                const text = await extractPdfText(file);
                if (text?.trim().length > 50) {
                    textInput.value = text;
                } else {
                    textInput.value = '';
                    alert('Could not extract text from PDF. Please copy and paste your resume text manually.');
                }
            } catch (pdfError) {
                console.error('PDF extraction failed:', pdfError);
                textInput.value = '';
                alert('Could not read PDF. Please copy and paste your resume text manually.');
            }

        } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
            textInput.value = '';
            alert('Word documents (.doc/.docx) cannot be parsed directly. Please copy and paste your resume text, or save as PDF.');

        } else {
            try {
                textInput.value = await file.text();
            } catch {
                textInput.value = '';
                alert('Could not read file. Please paste your resume text manually.');
            }
        }
    } catch (error) {
        console.error('File reading error:', error);
        textInput.value = '';
        alert('Error reading file. Please paste your resume text manually.');
    }
};

// ─── PDF.js Loading ───────────────────────────────────────────

/**
 * Load PDF.js library from CDN (lazy-loaded on first PDF upload).
 * @returns {Promise<void>}
 */
export const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
        if (window.pdfjsLib) { resolve(); return; }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Extract text content from a PDF file using PDF.js.
 * @param {File} file - PDF file
 * @returns {Promise<string>} Extracted text
 */
export const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }

    return fullText.trim();
};

// ─── Resume Parse & Search ────────────────────────────────────

/**
 * Parse resume text and search for matching jobs at the current company.
 * Uses saved resume data if no new text is provided.
 * @param {string} companyName - Company to search jobs for
 */
export const handleParseResume = async (companyName) => {
    const resumeText = document.getElementById('resumeTextInput')?.value;
    const savedResume = getResumeData();
    const locationInput = document.getElementById('locationInput');
    const timeRangeSelect = document.getElementById('timeRangeSelect');

    const textToUse = resumeText?.trim() || '';
    const hasNewResume = textToUse.length > 50;
    const hasSavedResume = savedResume?.skills?.length > 0;

    if (!hasNewResume && !hasSavedResume) {
        alert('Please paste your resume text or upload a resume file.');
        return;
    }

    if (!getActiveProvider()) {
        // Caller should handle this — but guard just in case
        alert('Please configure an API key in Admin settings.');
        return;
    }

    const resumeSection = document.getElementById('resumeUploadSection');
    const status = document.getElementById('jobSearchStatus');
    const statusText = document.getElementById('jobSearchStatusText');
    const results = document.getElementById('jobSearchResults');

    resumeSection.style.display = 'none';
    status.style.display = 'block';
    results.style.display = 'none';

    try {
        let allSkills, topSkills;
        let location = locationInput?.value?.trim() || '';
        const timeRange = timeRangeSelect?.value || 'month';

        if (hasNewResume) {
            statusText.textContent = 'Analyzing your resume...';
            const resumeData = await parseResume(textToUse);
            allSkills = resumeData.allSkills || resumeData.skills || [];
            topSkills = resumeData.topSkills || allSkills.slice(0, 5);

            if (!location && resumeData.currentLocation) {
                location = resumeData.currentLocation;
                if (locationInput) locationInput.value = location;
            }

            resumeData.skills = allSkills; // Backward compat
            saveResumeData(resumeData);
        } else {
            allSkills = savedResume.allSkills || savedResume.skills || [];
            topSkills = savedResume.topSkills || allSkills.slice(0, 5);
            if (!location && savedResume.currentLocation) {
                location = savedResume.currentLocation;
            }
        }

        if (!allSkills.length) {
            throw new Error('Could not extract skills from resume. Please ensure your resume includes technical skills.');
        }

        statusText.textContent = `Finding jobs for top ${topSkills.length} skills${location ? ` near ${location}` : ''}...`;
        const jobData = await searchJobsWithResume(companyName, topSkills, location, timeRange);

        status.style.display = 'none';
        results.style.display = 'block';
        results.innerHTML = renderMatchedJobResults(jobData, allSkills, location, topSkills);
    } catch (error) {
        status.style.display = 'block';
        status.innerHTML = `
            <div style="color: #ef4444;">❌ ${error.message}</div>
            <button onclick="document.getElementById('resumeUploadSection').style.display='block';document.getElementById('jobSearchStatus').style.display='none';" 
                    class="btn" style="margin-top: 1rem;">Try Again</button>
        `;
    }
};
