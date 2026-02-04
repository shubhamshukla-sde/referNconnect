/**
 * referNconnect Main Application
 * Orchestrates UI and Handlers modules with clean architecture
 */

import { state } from './state.js';
import * as UI from '../ui/index.js';
import * as Handlers from '../handlers/index.js';

/**
 * Initialize the application
 */
const init = async () => {
    setupEventListeners();

    // Always fetch from Firebase and show directory
    await Handlers.initializeData(state);
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
        onOpenCompany: showCompanyDetail
    });
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
