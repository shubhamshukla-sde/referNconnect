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
                ${emp.linkedin ? `<a href="${formatUrl(emp.linkedin)}" target="_blank" class="btn" style="flex: 1; background: #0077b5; font-size: 0.8rem; text-align: center; text-decoration: none; fill: white;">
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/></svg> 
                LinkedIn</a>` : ''}
                <button class="btn btn-referral" style="flex: 1; background: var(--primary); font-size: 0.8rem;">Contact Now</button>
            </div>
        </div>
    `;
};

export default {
    createCompanyCard,
    createEmployeeCard
};
