/**
 * @module Job Search
 * Job search modal management — event wiring, API-key checks, and search coordination.
 */

import {
    searchJobPosts,
    getActiveProvider,
    getResumeData,
    clearResumeData
} from '../services/ai/index.js';

import { handleResumeFile, handleParseResume } from './resume.js';
import { renderJobResults } from './job-results.js';

/** Currently selected company for job search */
let currentCompany = null;

/** Tracks whether modal listeners have been attached */
let listenersSetup = false;

// ─── Public API ───────────────────────────────────────────────

/**
 * Get the current company being searched.
 * @returns {Object|null}
 */
export const getCurrentCompany = () => currentCompany;

/**
 * Open the job search modal for a given company.
 * @param {Object} company - Company to search jobs for
 */
export const handleJobSearch = async (company) => {
    currentCompany = company;

    const modal = document.getElementById('jobSearchModal');
    const resumeSection = document.getElementById('resumeUploadSection');
    const status = document.getElementById('jobSearchStatus');
    const results = document.getElementById('jobSearchResults');
    const title = document.getElementById('jobModalTitle');
    const savedResumeInfo = document.getElementById('savedResumeInfo');
    const savedSkillsCount = document.getElementById('savedSkillsCount');
    const savedResumeIndicator = document.getElementById('savedResumeIndicator');
    const locationInput = document.getElementById('locationInput');

    if (!modal || !resumeSection || !status || !results) return;

    // Reset modal state
    title.textContent = `🔍 ${company.name}`;
    resumeSection.style.display = 'block';
    status.style.display = 'none';
    results.style.display = 'none';

    // Load saved resume data
    const savedResume = getResumeData();
    if (savedResume?.skills?.length) {
        if (savedResumeInfo) savedResumeInfo.style.display = 'flex';
        if (savedSkillsCount) savedSkillsCount.textContent = savedResume.skills.length;
        if (savedResumeIndicator) savedResumeIndicator.style.display = 'inline';
        if (locationInput && savedResume.currentLocation) {
            locationInput.value = savedResume.currentLocation;
        }
    } else {
        if (savedResumeInfo) savedResumeInfo.style.display = 'none';
        if (savedResumeIndicator) savedResumeIndicator.style.display = 'none';
    }

    modal.style.display = 'flex';
    setupJobModalListeners(modal);
};

// ─── Modal Event Listeners ────────────────────────────────────

/**
 * Attach event listeners to the job search modal (idempotent — only runs once).
 * @param {HTMLElement} modal
 */
const setupJobModalListeners = (modal) => {
    if (listenersSetup) return;
    listenersSetup = true;

    // Close
    document.getElementById('btnCloseJobModal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Resume drop zone
    const dropZone = document.getElementById('resumeDropZone');
    const fileInput = document.getElementById('resumeFileInput');

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.background = 'rgba(99, 102, 241, 0.1)';
    });
    dropZone?.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'transparent';
    });
    dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'transparent';
        if (e.dataTransfer.files[0]) handleResumeFile(e.dataTransfer.files[0]);
    });
    fileInput?.addEventListener('change', (e) => {
        if (e.target.files[0]) handleResumeFile(e.target.files[0]);
    });

    // Parse resume — delegates to resume.js, passing current company name
    document.getElementById('btnParseResume')?.addEventListener('click', () => {
        if (!getActiveProvider()) { showApiKeyRequired(); return; }
        handleParseResume(currentCompany?.name);
    });

    // Search all jobs (without resume)
    document.getElementById('btnSearchAllJobs')?.addEventListener('click', handleSearchAllJobs);

    // Clear saved resume
    document.getElementById('btnClearResume')?.addEventListener('click', () => {
        clearResumeData();
        document.getElementById('savedResumeInfo').style.display = 'none';
        document.getElementById('resumeTextInput').value = '';
    });
};

// ─── Search Without Resume ────────────────────────────────────

/**
 * Search all jobs for the current company without resume matching.
 */
const handleSearchAllJobs = async () => {
    if (!getActiveProvider()) { showApiKeyRequired(); return; }

    const resumeSection = document.getElementById('resumeUploadSection');
    const status = document.getElementById('jobSearchStatus');
    const statusText = document.getElementById('jobSearchStatusText');
    const results = document.getElementById('jobSearchResults');
    const locationInput = document.getElementById('locationInput');
    const timeRangeSelect = document.getElementById('timeRangeSelect');

    const location = locationInput?.value?.trim() || '';
    const timeRange = timeRangeSelect?.value || 'month';

    resumeSection.style.display = 'none';
    status.style.display = 'block';
    statusText.textContent = `Searching for jobs${location ? ` near ${location}` : ''}...`;
    results.style.display = 'none';

    try {
        const jobData = await searchJobPosts(currentCompany.name, location, timeRange);
        status.style.display = 'none';
        results.style.display = 'block';
        results.innerHTML = renderJobResults(jobData, location);
    } catch (error) {
        status.innerHTML = `
            <div style="color: #ef4444;">❌ Error: ${error.message}</div>
            <button onclick="document.getElementById('resumeUploadSection').style.display='block';document.getElementById('jobSearchStatus').style.display='none';" 
                    class="btn" style="margin-top: 1rem;">Try Again</button>
        `;
    }
};

// ─── API Key Required UI ──────────────────────────────────────

/**
 * Show an "API Key Required" message in the results area.
 */
export const showApiKeyRequired = () => {
    const resumeSection = document.getElementById('resumeUploadSection');
    const results = document.getElementById('jobSearchResults');

    resumeSection.style.display = 'none';
    results.style.display = 'block';
    results.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔑</div>
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">API Key Required</div>
            <div style="color: var(--text-dim); margin-bottom: 1.5rem;">
                Please configure your Perplexity API key in the Admin page.
            </div>
            <a href="pages/admin.html" class="btn" style="display: inline-block; padding: 0.6rem 1.2rem; text-decoration: none;">
                Go to Admin Settings
            </a>
        </div>
    `;
};
