/**
 * @module referNconnect Main Application
 * Thin orchestrator — wires together UI, Handlers, and feature modules.
 * All heavy logic lives in focused modules:
 *   - job-search.js  — job search modal & coordination
 *   - resume.js      — resume upload & parsing
 *   - job-results.js — job result HTML rendering
 */

import { state } from './state.js';
import * as UI from '../ui/index.js';
import * as Handlers from '../handlers/index.js';
import { handleJobSearch } from './job-search.js';

// ─── Initialization ───────────────────────────────────────────

/**
 * Initialize the application — load data, wire events, show directory.
 */
const init = async () => {
    setupEventListeners();

    // Always fetch from Firebase and show directory
    await Handlers.initializeData(state);

    // Apply global settings
    if (localStorage.getItem('editMode') === 'true') {
        document.body.classList.add('edit-mode');
    }

    UI.showView('viewDirectory', renderDirectory);
};

// ─── Event Listeners ──────────────────────────────────────────

/**
 * Setup all top-level DOM event listeners.
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

    // Clear data — reload after clearing
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

// ─── View Rendering ───────────────────────────────────────────

/**
 * Render the company directory grid with an optional search filter.
 * @param {string} [filter=''] - Search query
 */
const renderDirectory = (filter = '') => {
    UI.renderDirectory(state.data, filter, {
        onEditCompany: (companyId) => openEditModal('company', companyId),
        onOpenCompany: showCompanyDetail,
        onSearchJobs: handleJobSearch
    });
};

/**
 * Show the detail view for a company (employees list).
 * @param {Object} company
 */
const showCompanyDetail = (company) => {
    UI.showView('viewDetail');
    UI.renderDetail(company, {
        onEditEmployee: (empId, companyId) => openEditModal('employee', empId, companyId),
        onAskReferral: Handlers.handleAskReferral
    });
};

/**
 * Open edit modal for a company or employee.
 * @param {string} type - 'company' or 'employee'
 * @param {string} id - Item ID
 * @param {string|null} [parentId=null] - Parent company ID (for employees)
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

// ─── Bootstrap ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

export default { state };
