/**
 * UI Components
 * Card rendering functions for companies and employees
 */

import { formatUrl, formatSize } from '../utils/helpers.js';

/**
 * Generate a deterministic color for company avatars
 */
const avatarColors = [
    '#5b9cf5', '#a78bfa', '#2fbc71', '#f59e0b',
    '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'
];
const getAvatarColor = (name) =>
    avatarColors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];

/**
 * Create a company card HTML — LinkedIn-style horizontal layout
 * @param {Object} company - Company data
 * @returns {string} HTML string
 */
export const createCompanyCard = (company) => {
    const employeeCount = Array.isArray(company.employees) ? company.employees.length : 0;
    const sizeStr = formatSize(company.size);
    const initial = (company.name || '?')[0].toUpperCase();
    const color = getAvatarColor(company.name);

    return `
        <div class="card company-card" data-id="${company.id}">
            <div class="company-avatar" style="background: ${color}15; color: ${color}; border-color: ${color}25;">${initial}</div>
            <div class="card-body">
                <div class="card-top">
                    <h3 class="card-title">${company.name}</h3>
                    <button class="btn-edit" style="background: transparent; border: none; color: var(--text-dim); cursor: pointer; padding: 0.25rem;" title="Edit Company">✏️</button>
                </div>
                <div class="card-meta">
                    <span>${company.headquarters || 'Global'}</span>
                    ${sizeStr ? `<span class="meta-dot">·</span><span>${sizeStr}</span>` : ''}
                    ${company.domain ? `<span class="meta-dot">·</span><a href="${formatUrl(company.domain)}" target="_blank" onclick="event.stopPropagation()" class="card-link">${(company.domain || '').replace(/^https?:\/\//, '')}</a>` : ''}
                </div>
                <div class="card-footer">
                    <span class="industry-badge">${company.industry || 'General'}</span>
                    <span class="contact-count">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        ${employeeCount}
                    </span>
                    <div class="card-actions">
                        <button class="btn-card btn-jobs" title="Search jobs">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                            Jobs
                        </button>
                        <button class="btn-card btn-open" title="View contacts">
                            View
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

/**
 * Create an employee card HTML — LinkedIn-style with avatar
 * @param {Object} emp - Employee data
 * @param {Object} company - Parent company data
 * @returns {string} HTML string
 */
export const createEmployeeCard = (emp, company) => {
    const firstName = emp.firstName || emp.name?.split(' ')[0] || '';
    const lastName = emp.lastName || emp.name?.split(' ').slice(1).join(' ') || '';
    const jobTitle = emp.jobTitle || emp.title || 'Team Member';
    const initials = `${(firstName?.[0] || '?')}${(lastName?.[0] || '')}`.toUpperCase();

    return `
        <div class="card employee-card" data-id="${emp.id}" data-company="${company.id}">
            <div class="emp-avatar">${initials}</div>
            <div class="emp-body">
                <div class="card-top">
                    <div>
                        <div class="emp-name">${firstName} ${lastName}</div>
                        <div class="emp-title">${jobTitle}</div>
                    </div>
                    <button class="btn-edit" style="background: transparent; border: none; color: var(--text-dim); cursor: pointer; padding: 0.25rem;" title="Edit Employee">✏️</button>
                </div>
                <div class="emp-details">
                    <div class="emp-detail-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <span>${emp.email || 'No email'}</span>
                    </div>
                    <div class="emp-detail-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span>${emp.phoneLocked ? '🔒 Hidden' : (emp.phone || 'No phone')}</span>
                    </div>
                    <div class="emp-detail-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>${emp.location || 'Unknown'}</span>
                    </div>
                </div>
                <div class="emp-actions">
                    ${emp.linkedin ? `<a href="${formatUrl(emp.linkedin)}" target="_blank" class="btn-linkedin">
                        <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/></svg>
                        LinkedIn
                    </a>` : ''}
                    <button class="btn btn-referral btn-contact">Contact</button>
                </div>
            </div>
        </div>
    `;
};
