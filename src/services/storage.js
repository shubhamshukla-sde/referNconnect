/**
 * Local Storage Service
 * Handles localStorage caching for offline access
 */

import { STORAGE_KEYS, FIELD_MAPPINGS } from '../config/index.js';
import { generateId } from '../utils/helpers.js';

/**
 * Storage service for company data caching
 */
export const Storage = {
    /**
     * Save companies to localStorage
     * @param {Array} data - Companies array to save
     */
    save(data) {
        if (!Array.isArray(data)) return;

        // Ensure all records have IDs and proper structure
        const normalized = data.map(company => ({
            id: company.id || generateId(),
            name: company.name || company['Company name'] || 'Unknown',
            domain: company.domain || company['Company domain'] || '',
            industry: company.industry || company['Company industry'] || '',
            size: company.size || company['Company size'] || '',
            type: company.type || company['Company type'] || '',
            headquarters: company.headquarters || company['Company headquarters'] || '',
            linkedin: company.linkedin || company['Company LinkedIn'] || '',
            employees: (company.employees || []).map(emp => ({
                id: emp.id || generateId(),
                firstName: emp.firstName || emp['First name'] || '',
                lastName: emp.lastName || emp['Last name'] || '',
                email: emp.email || emp['Email'] || '',
                phone: emp.phone || emp['Phone'] || '',
                jobTitle: emp.jobTitle || emp['Job title'] || '',
                linkedin: emp.linkedin || emp['LinkedIn'] || '',
                location: emp.location || emp['Location'] || ''
            }))
        }));

        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(normalized));
    },

    /**
     * Load companies from localStorage
     * @returns {Array} Companies array
     */
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.COMPANIES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return [];
        }
    },

    /**
     * Clear all stored data
     */
    clear() {
        localStorage.removeItem(STORAGE_KEYS.COMPANIES);
    }
};
