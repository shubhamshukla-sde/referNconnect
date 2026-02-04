/**
 * JSON Parser
 * Handles parsing of JSON data into structured format
 */

import { generateId } from '../utils/helpers.js';
import { FIELD_MAPPINGS } from '../config/index.js';

/**
 * Normalize a record using field mappings
 * @param {Object} record - Raw record object
 * @param {Object} mappings - Field mappings
 * @returns {Object} Normalized record
 */
const normalizeRecord = (record, mappings) => {
    const normalized = {};

    for (const [original, mapped] of Object.entries(mappings)) {
        if (record[original] !== undefined) {
            normalized[mapped] = record[original];
        } else if (record[mapped] !== undefined) {
            normalized[mapped] = record[mapped];
        }
    }

    return normalized;
};

/**
 * Parse JSON data into structured company/employee format
 * Handles both flat arrays and pre-grouped structures
 * @param {string|Array} input - JSON string or array
 * @returns {Array} Array of company objects with employees
 */
export const parse = (input) => {
    // Parse if string
    let data;
    if (typeof input === 'string') {
        try {
            data = JSON.parse(input);
        } catch (error) {
            console.error('JSON parse error:', error);
            return [];
        }
    } else {
        data = input;
    }

    if (!Array.isArray(data)) {
        return [];
    }

    // Check if already in company format (has employees array)
    if (data.length > 0 && Array.isArray(data[0].employees)) {
        return data.map(company => ({
            id: company.id || generateId(),
            name: company.name || company['Company name'] || 'N/A',
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
    }

    // Flat array - group by company
    const companyMap = new Map();

    for (const item of data) {
        const companyData = normalizeRecord(item, FIELD_MAPPINGS.company);
        const employeeData = normalizeRecord(item, FIELD_MAPPINGS.employee);

        const companyName = companyData.name || item.name || item['Company name'] || 'N/A';
        const domain = companyData.domain || item.domain || item['Company domain'] || '';

        // Use normalized domain as key if available, otherwise name
        const companyKey = (domain || companyName).toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '')
            .trim();

        if (!companyMap.has(companyKey)) {
            companyMap.set(companyKey, {
                id: generateId(),
                name: companyName,
                domain: domain,
                industry: companyData.industry || item.industry || '',
                size: companyData.size || item.size || '',
                type: companyData.type || item.type || '',
                headquarters: companyData.headquarters || item.headquarters || '',
                linkedin: companyData.linkedin || item.linkedin || '',
                employees: []
            });
        }

        // Add employee if they have a name
        const firstName = employeeData.firstName || item.firstName || item['First name'] || '';
        const lastName = employeeData.lastName || item.lastName || item['Last name'] || '';

        if (firstName || lastName) {
            companyMap.get(companyKey).employees.push({
                id: generateId(),
                firstName,
                lastName,
                email: employeeData.email || item.email || '',
                phone: employeeData.phone || item.phone || '',
                jobTitle: employeeData.jobTitle || item.jobTitle || item.title || '',
                linkedin: employeeData.linkedin || item.linkedin || '',
                location: employeeData.location || item.location || ''
            });
        }
    }

    return Array.from(companyMap.values());
};

export default { parse };
