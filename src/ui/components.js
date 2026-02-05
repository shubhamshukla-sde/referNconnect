/**
 * UI Components
 * Card rendering functions for companies and employees
 */

import { formatUrl, formatSize } from '../utils/helpers.js';

/**
 * Create a company card HTML
 * @param {Object} company - Company data
 * @returns {string} HTML string
 */
export const createCompanyCard = (company) => {
    const employeeCount = Array.isArray(company.employees) ? company.employees.length : 0;

    return `
        <div class="card" data-id="${company.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; color: var(--accent); font-weight: 600; text-transform: uppercase; border: 1px solid var(--border); padding: 0.2rem 0.5rem; border-radius: 4px;">${company.industry || 'General'}</span>
                <button class="btn-edit" style="background: transparent; border: none; color: var(--text-dim); cursor: pointer;" title="Edit Company">✏️</button>
            </div>
            <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem;">${company.name}</h3>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.2rem;">
                <span>📍 ${company.headquarters || 'Global'}</span>
                <span>🏢 ${company.type || 'Company'} • ${formatSize(company.size)}</span>
                <a href="${formatUrl(company.domain)}" target="_blank" onclick="event.stopPropagation()" style="color: var(--primary); text-decoration: none; margin-top: 0.4rem;">${(company.domain || '').replace(/^https?:\/\//, '')}</a>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                <span style="color: var(--text-dim); font-size: 0.85rem;">${employeeCount} Referral Contacts</span>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-jobs" style="background: linear-gradient(135deg, #10b981, #059669); padding: 0.5rem 0.8rem; font-size: 0.8rem;" title="Find recent job posts">🔍 Jobs</button>
                    <button class="btn btn-view" style="background: var(--surface); padding: 0.5rem 1rem;">Open</button>
                </div>
            </div>
        </div>
    `;
};

/**
 * Create an employee card HTML
 * @param {Object} emp - Employee data
 * @param {Object} company - Parent company data
 * @returns {string} HTML string
 */
export const createEmployeeCard = (emp, company) => {
    // Fallback for names if they come from the restore script or different schema
    const firstName = emp.firstName || emp.name?.split(' ')[0] || '';
    const lastName = emp.lastName || emp.name?.split(' ').slice(1).join(' ') || '';
    const jobTitle = emp.jobTitle || emp.title || 'Team Member';

    const initials = `${(firstName?.[0] || '?')}${(lastName?.[0] || '')}`.toUpperCase();

    return `
        <div class="card" data-id="${emp.id}" data-company="${company.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">${initials}</div>
                <button class="btn-edit" style="background: transparent; border: none; color: var(--text-dim); cursor: pointer;" title="Edit Employee">✏️</button>
            </div>
            <h3 style="margin-bottom: 0.2rem;">${firstName} ${lastName}</h3>
            <div style="color: var(--primary); font-size: 0.9rem; font-weight: 500; margin-bottom: 1rem;">${jobTitle}</div>
            
            <div style="color: var(--text-dim); font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">📧 <span>${emp.email || 'No email'}</span></div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">📱 <span>${emp.phone || 'No phone'}</span></div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">📍 <span>${emp.location || 'Unknown'}</span></div>
            </div>

            <div style="margin-top: 2rem; display: flex; gap: 0.5rem;">
                ${emp.linkedin ? `<a href="${formatUrl(emp.linkedin)}" target="_blank" class="btn" style="flex: 1; background: #0077b5; font-size: 0.8rem; text-align: center; text-decoration: none;">LinkedIn</a>` : ''}
                <button class="btn btn-referral" style="flex: 1; background: var(--primary); font-size: 0.8rem;">Contact Now</button>
            </div>
        </div>
    `;
};

export default {
    createCompanyCard,
    createEmployeeCard
};
