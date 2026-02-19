/**
 * referNconnect Main Application
 * Orchestrates UI and Handlers modules with clean architecture
 */

import { state } from './state.js';
import * as UI from '../ui/index.js';
import * as Handlers from '../handlers/index.js';
import {
    searchJobPosts,
    getActiveProvider,
    parseResume,
    searchJobsWithResume,
    saveResumeData,
    getResumeData,
    clearResumeData
} from '../services/ai.js';

/**
 * Initialize the application
 */
const init = async () => {
    setupEventListeners();

    // Always fetch from Firebase and show directory
    // Always fetch from Firebase and show directory
    await Handlers.initializeData(state);

    // Apply global settings
    if (localStorage.getItem('editMode') === 'true') {
        document.body.classList.add('edit-mode');
    }

    UI.showView('viewDirectory', renderDirectory);
};

/**
 * Setup all DOM event listeners
 */
const setupEventListeners = () => {
    // File upload
    document.getElementById('fileCsv')?.addEventListener('change', (e) => {
        Handlers.handleFileUpload(e.target.files[0], state, () => {
            UI.showView('viewDirectory', renderDirectory);
        });
    });

    // Search
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        renderDirectory(e.target.value);
    });

    // Navigation
    document.getElementById('btnBack')?.addEventListener('click', () => {
        UI.showView('viewDirectory', renderDirectory);
    });

    // Clear data - reload the page after clearing
    document.getElementById('btnClearData')?.addEventListener('click', () => {
        Handlers.handleClear(state, () => window.location.reload());
    });

    // Modal buttons
    document.getElementById('btnCancelEdit')?.addEventListener('click', () => {
        UI.hideModal('editModal');
        state.editingTarget = null;
    });

    document.getElementById('btnSaveEdit')?.addEventListener('click', () => {
        Handlers.saveEdit(state, (type, parentId) => {
            if (type === 'company') {
                renderDirectory(document.getElementById('searchInput')?.value || '');
            } else {
                const company = state.data.find(c => c.id === parentId);
                showCompanyDetail(company);
            }
        });
    });
};

/**
 * Render directory with current filter
 * @param {string} filter - Search filter
 */
const renderDirectory = (filter = '') => {
    UI.renderDirectory(state.data, filter, {
        onEditCompany: (companyId) => openEditModal('company', companyId),
        onOpenCompany: showCompanyDetail,
        onSearchJobs: handleJobSearch
    });
};

/**
 * Handle job search for a company
 * @param {Object} company - Company to search jobs for
 */
let currentCompany = null; // Track current company for resume search

const handleJobSearch = async (company) => {
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
    if (savedResume && savedResume.skills?.length) {
        // Show saved resume indicator
        if (savedResumeInfo) savedResumeInfo.style.display = 'flex';
        if (savedSkillsCount) savedSkillsCount.textContent = savedResume.skills.length;
        if (savedResumeIndicator) savedResumeIndicator.style.display = 'inline';

        // Pre-fill location from saved resume if available
        if (locationInput && savedResume.currentLocation) {
            locationInput.value = savedResume.currentLocation;
        }
    } else {
        if (savedResumeInfo) savedResumeInfo.style.display = 'none';
        if (savedResumeIndicator) savedResumeIndicator.style.display = 'none';
    }

    // Show modal
    modal.style.display = 'flex';

    // Setup event listeners (only once)
    setupJobModalListeners(modal);
};

/**
 * Setup job modal event listeners
 */
let listenersSetup = false;
const setupJobModalListeners = (modal) => {
    if (listenersSetup) return;
    listenersSetup = true;

    // Close button
    document.getElementById('btnCloseJobModal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Background click to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Drop zone click
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
        const file = e.dataTransfer.files[0];
        if (file) handleResumeFile(file);
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleResumeFile(file);
    });

    // Parse resume button
    document.getElementById('btnParseResume')?.addEventListener('click', handleParseResume);

    // Search all jobs button
    document.getElementById('btnSearchAllJobs')?.addEventListener('click', handleSearchAllJobs);

    // Clear resume button
    document.getElementById('btnClearResume')?.addEventListener('click', () => {
        clearResumeData();
        document.getElementById('savedResumeInfo').style.display = 'none';
        document.getElementById('resumeTextInput').value = '';
    });
};

/**
 * Handle resume file upload
 */
const handleResumeFile = async (file) => {
    const textInput = document.getElementById('resumeTextInput');
    const statusText = document.getElementById('jobSearchStatusText');

    try {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            // Plain text file
            const text = await file.text();
            textInput.value = text;

        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // PDF file - try to extract text
            textInput.value = 'Extracting text from PDF...';

            try {
                // Load PDF.js from CDN if not already loaded
                if (!window.pdfjsLib) {
                    await loadPdfJs();
                }

                const text = await extractPdfText(file);
                if (text && text.trim().length > 50) {
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
            // Word documents - can't parse in browser easily
            textInput.value = '';
            alert('Word documents (.doc/.docx) cannot be parsed directly. Please copy and paste your resume text, or save as PDF.');

        } else {
            // Try to read as text anyway
            try {
                const text = await file.text();
                textInput.value = text;
            } catch (e) {
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

/**
 * Load PDF.js library from CDN
 */
const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Extract text content from a PDF file
 */
const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText.trim();
};

/**
 * Parse resume and search for matching jobs
 */
const handleParseResume = async () => {
    const resumeText = document.getElementById('resumeTextInput')?.value;
    const savedResume = getResumeData();
    const locationInput = document.getElementById('locationInput');
    const timeRangeSelect = document.getElementById('timeRangeSelect');

    // Use saved resume if no new text provided
    const textToUse = resumeText?.trim() || '';
    const hasNewResume = textToUse.length > 50;
    const hasSavedResume = savedResume?.skills?.length > 0;

    if (!hasNewResume && !hasSavedResume) {
        alert('Please paste your resume text or upload a resume file.');
        return;
    }

    if (!getActiveProvider()) {
        showApiKeyRequired();
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
        let allSkills;
        let topSkills;
        let location = locationInput?.value?.trim() || '';
        const timeRange = timeRangeSelect?.value || 'month';

        if (hasNewResume) {
            // Parse new resume
            statusText.textContent = 'Analyzing your resume...';
            const resumeData = await parseResume(textToUse);
            allSkills = resumeData.allSkills || resumeData.skills || [];
            topSkills = resumeData.topSkills || allSkills.slice(0, 5);

            // Use input location or extracted location
            if (!location && resumeData.currentLocation) {
                location = resumeData.currentLocation;
                locationInput.value = location; // Update input field
            }

            // Save for future use (save both allSkills and topSkills)
            resumeData.skills = allSkills; // Backward compat
            saveResumeData(resumeData);
        } else {
            // Use saved skills
            allSkills = savedResume.allSkills || savedResume.skills || [];
            topSkills = savedResume.topSkills || allSkills.slice(0, 5);
            if (!location && savedResume.currentLocation) {
                location = savedResume.currentLocation;
            }
        }

        if (!allSkills.length) {
            throw new Error('Could not extract skills from resume. Please ensure your resume includes technical skills.');
        }

        // Search for matching jobs using TOP 5 most in-demand skills
        statusText.textContent = `Finding jobs for top ${topSkills.length} skills${location ? ` near ${location}` : ''}...`;
        const jobData = await searchJobsWithResume(currentCompany.name, topSkills, location, timeRange);

        // Render results (show all skills but searched with top skills)
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

/**
 * Search all jobs without resume matching
 */
const handleSearchAllJobs = async () => {
    if (!getActiveProvider()) {
        showApiKeyRequired();
        return;
    }

    const resumeSection = document.getElementById('resumeUploadSection');
    const status = document.getElementById('jobSearchStatus');
    const statusText = document.getElementById('jobSearchStatusText');
    const results = document.getElementById('jobSearchResults');
    const locationInput = document.getElementById('locationInput');
    const timeRangeSelect = document.getElementById('timeRangeSelect');

    // Get user inputs
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

/**
 * Show API key required message
 */
const showApiKeyRequired = () => {
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

/**
 * Render job results with match percentages
 */
const renderMatchedJobResults = (jobData, allSkills, candidateLocation = '', topSkills = []) => {
    let html = '';

    // Show candidate info section - highlight top skills
    html += `
        <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1)); border-radius: 8px;">
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;">
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">🔥 Top In-Demand Skills (${topSkills.length})</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem;">
                        ${topSkills.map(s => `<span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">${s}</span>`).join('')}
                    </div>
                    ${allSkills.length > topSkills.length ? `
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.5rem;">
                        +${allSkills.length - topSkills.length} other skills: ${allSkills.filter(s => !topSkills.includes(s)).slice(0, 5).join(', ')}${allSkills.length - topSkills.length > 5 ? '...' : ''}
                    </div>
                    ` : ''}
                </div>
                ${candidateLocation ? `
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">📍 Location</div>
                    <div style="background: var(--surface); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.85rem;">${candidateLocation}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    // Handle new searchLinks format (Google search cards)
    if (jobData.searchLinks && jobData.searchLinks.length > 0) {
        html += `
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-dim);">
                🔍 Click any search below to find LinkedIn posts on Google:
            </div>
        `;
        html += `<div style="display: grid; gap: 0.75rem;">`;
        html += jobData.searchLinks.map(link => `
            <a href="${link.googleSearchUrl}" target="_blank" class="job-post-card" style="display: block; text-decoration: none; color: inherit; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
               onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';"
               onmouseout="this.style.transform='';this.style.boxShadow='';">
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    <div style="font-size: 1.5rem;">${link.icon || '🔍'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${link.title}</div>
                        <div style="font-size: 0.85rem; color: var(--text-dim);">${link.description}</div>
                        ${link.location ? `<div style="font-size: 0.75rem; color: #818cf8; margin-top: 0.25rem;">📍 ${link.location}</div>` : ''}
                    </div>
                    <div style="color: var(--primary); font-size: 1.2rem;">→</div>
                </div>
            </a>
        `).join('');
        html += `</div>`;
    }
    // Fallback for old jobPosts format
    else if (jobData.jobPosts && jobData.jobPosts.length > 0) {
        html += jobData.jobPosts.map(post => `
            <div class="job-post-card">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">${post.title || 'Job Opening'}</div>
                <div style="font-size: 0.9rem; margin-bottom: 0.75rem;">${post.summary || ''}</div>
                ${post.url ? `<a href="${post.url}" target="_blank" class="btn" style="display: inline-block; padding: 0.4rem 0.8rem; font-size: 0.8rem; text-decoration: none;">View Post →</a>` : ''}
            </div>
        `).join('');
    } else {
        html += `
            <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>
                <div>No search links generated</div>
            </div>
        `;
    }

    return html;
};

/**
 * Render job search results HTML (without resume matching)
 * @param {Object} jobData - Job search data from AI
 * @returns {string} HTML string
 */
const renderJobResults = (jobData) => {
    const statusClass = jobData.hiringStatus?.toLowerCase().includes('active') ? 'active' :
        jobData.hiringStatus?.toLowerCase().includes('some') ? 'some' : 'none';

    let html = `
        <div style="margin-bottom: 1.5rem;">
            <span class="hiring-status ${statusClass}">${jobData.hiringStatus || 'Unknown'}</span>
        </div>
    `;

    // Handle new searchLinks format
    if (jobData.searchLinks && jobData.searchLinks.length > 0) {
        html += `
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-dim);">
                🔍 Click any search below to find LinkedIn posts on Google:
            </div>
        `;
        html += `<div style="display: grid; gap: 0.75rem;">`;
        html += jobData.searchLinks.map(link => `
            <a href="${link.googleSearchUrl}" target="_blank" class="job-post-card" style="display: block; text-decoration: none; color: inherit; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
               onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';"
               onmouseout="this.style.transform='';this.style.boxShadow='';">
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    <div style="font-size: 1.5rem;">${link.icon || '🔍'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${link.title}</div>
                        <div style="font-size: 0.85rem; color: var(--text-dim);">${link.description}</div>
                    </div>
                    <div style="color: var(--primary); font-size: 1.2rem;">→</div>
                </div>
            </a>
        `).join('');
        html += `</div>`;
    }
    // Fallback for old jobPosts format
    else if (jobData.jobPosts && jobData.jobPosts.length > 0) {
        html += jobData.jobPosts.map(post => `
            <div class="job-post-card">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">${post.title || 'Job Opening'}</div>
                <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem;">
                    ${post.source ? `📍 ${post.source}` : ''} 
                    ${post.postedBy ? `• 👤 ${post.postedBy}` : ''}
                    ${post.date ? `• 📅 ${post.date}` : ''}
                </div>
                <div style="font-size: 0.9rem; margin-bottom: 0.75rem;">${post.summary || ''}</div>
                ${post.url ? `<a href="${post.url}" target="_blank" class="btn" style="display: inline-block; padding: 0.4rem 0.8rem; font-size: 0.8rem; text-decoration: none;">View Post →</a>` : ''}
            </div>
        `).join('');
    } else {
        html += `
            <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>
                <div>No search links generated</div>
            </div>
        `;
    }

    if (jobData.notes) {
        html += `
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--surface); border-radius: 8px; font-size: 0.85rem; color: var(--text-dim);">
                💡 ${jobData.notes}
            </div>
        `;
    }

    return html;
};

/**
 * Show company detail view
 * @param {Object} company - Company to display
 */
const showCompanyDetail = (company) => {
    UI.showView('viewDetail');
    UI.renderDetail(company, {
        onEditEmployee: (empId, companyId) => openEditModal('employee', empId, companyId),
        onAskReferral: Handlers.handleAskReferral
    });
};

/**
 * Open edit modal for company or employee
 * @param {string} type - 'company' or 'employee'
 * @param {string} id - Item ID
 * @param {string|null} parentId - Parent company ID for employees
 */
const openEditModal = (type, id, parentId = null) => {
    state.editingTarget = { type, id, pid: parentId };

    let targetData;
    if (type === 'company') {
        targetData = state.data.find(c => c.id === id);
    } else {
        const company = state.data.find(c => c.id === parentId);
        targetData = company?.employees?.find(e => e.id === id);
    }

    if (targetData) {
        UI.openEditModal(type, targetData);
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', init);

export default { state };
