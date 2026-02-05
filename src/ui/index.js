/**
 * UI Index
 * Re-exports all UI modules for convenient importing
 */

export { createCompanyCard, createEmployeeCard } from './components.js';
export { showView, getActiveView } from './views.js';
export { openEditModal, hideModal, getEditFormValues } from './modals.js';

import { formatUrl, formatSize } from '../utils/helpers.js';
import { createCompanyCard, createEmployeeCard } from './components.js';

/**
 * Render company directory grid
 * @param {Array} companies - Array of company objects
 * @param {string} filter - Search filter string
 * @param {Object} callbacks - Event callbacks
 */
export const renderDirectory = (companies, filter = '', callbacks = {}) => {
    const grid = document.getElementById('companyGrid');
    if (!grid) return;

    const filteredCompanies = companies.filter(c => {
        const query = (filter || '').toLowerCase();
        const nameMatch = (c.name || '').toLowerCase().includes(query);
        const industryMatch = (c.industry || '').toLowerCase().includes(query);
        const employeeMatch = Array.isArray(c.employees) && c.employees.some(e =>
            (e.firstName || '').toLowerCase().includes(query) ||
            (e.lastName || '').toLowerCase().includes(query) ||
            (e.name || '').toLowerCase().includes(query) || // Search fallback 'name'
            (e.jobTitle || '').toLowerCase().includes(query) ||
            (e.title || '').toLowerCase().includes(query)   // Search fallback 'title'
        );
        return nameMatch || industryMatch || employeeMatch;
    });

    // Sort companies lexicographically
    filteredCompanies.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    grid.innerHTML = filteredCompanies.map(company => createCompanyCard(company)).join('');

    // Attach event listeners
    grid.querySelectorAll('.card').forEach(card => {
        const id = card.dataset.id;
        const company = companies.find(c => c.id === id);

        card.querySelector('.btn-edit')?.addEventListener('click', (e) => {
            e.stopPropagation();
            callbacks.onEditCompany?.(id);
        });

        card.querySelector('.btn-view')?.addEventListener('click', (e) => {
            e.stopPropagation();
            callbacks.onOpenCompany?.(company);
        });

        card.querySelector('.btn-jobs')?.addEventListener('click', (e) => {
            e.stopPropagation();
            callbacks.onSearchJobs?.(company);
        });

        // Also allow clicking the card itself
        card.addEventListener('click', () => {
            callbacks.onOpenCompany?.(company);
        });
    });
};

/**
 * Render employee detail view for a company
 * @param {Object} company - Company object
 * @param {Object} callbacks - Event callbacks
 */
export const renderDetail = (company, callbacks = {}) => {
    const header = document.getElementById('detailHeader');
    const grid = document.getElementById('employeeGrid');

    if (!header || !grid) return;

    // Use classes for detail header
    header.innerHTML = `
        <div class="detail-header-content">
            <div class="detail-header-main">
               <h1 class="detail-title">${company.name}</h1>
               <p class="detail-subtitle">Displaying all referral contacts for ${company.name}</p>
            </div>
            <div class="detail-header-meta">
                <div class="detail-meta-item">${company.industry || 'General'}</div>
                <div class="detail-meta-item">${company.headquarters || 'Global'}</div>
            </div>
        </div>
    `;

    // Sort employees lexicographically
    const sortedEmployees = [...(company.employees || [])].sort((a, b) => {
        const nameA = a.firstName || a.lastName ? `${a.firstName || ''} ${a.lastName || ''}`.trim() : (a.name || '');
        const nameB = b.firstName || b.lastName ? `${b.firstName || ''} ${b.lastName || ''}`.trim() : (b.name || '');
        return nameA.localeCompare(nameB);
    });

    // Render employee cards
    grid.innerHTML = sortedEmployees.map(emp =>
        createEmployeeCard(emp, company)
    ).join('');

    // Attach event listeners
    grid.querySelectorAll('.card').forEach(card => {
        const empId = card.dataset.id;
        const companyId = card.dataset.company;
        const emp = company.employees?.find(e => e.id === empId);

        card.querySelector('.btn-edit')?.addEventListener('click', () => {
            callbacks.onEditEmployee?.(empId, companyId);
        });

        card.querySelector('.btn-referral')?.addEventListener('click', () => {
            callbacks.onAskReferral?.(emp);
        });
    });
};
