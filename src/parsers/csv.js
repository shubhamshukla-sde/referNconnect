/**
 * CSV Parser
 * Handles parsing of CSV files into structured data
 */

import { generateId } from '../utils/helpers.js';
import { FIELD_MAPPINGS } from '../config/index.js';

/**
 * Parse a single CSV line handling quotes and special characters
 * @param {string} line - CSV line to parse
 * @returns {Array} Array of field values
 */
const parseLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
};

/**
 * Map a field name to its normalized key
 * @param {string} header - Original header name
 * @returns {string} Normalized key name
 */
const normalizeHeader = (header) => {
    const trimmed = header.trim();

    // Check company mappings
    if (FIELD_MAPPINGS.company[trimmed]) {
        return { key: FIELD_MAPPINGS.company[trimmed], type: 'company' };
    }

    // Check employee mappings
    if (FIELD_MAPPINGS.employee[trimmed]) {
        return { key: FIELD_MAPPINGS.employee[trimmed], type: 'employee' };
    }

    // Return lowercase version as fallback
    return { key: trimmed.toLowerCase().replace(/\s+/g, '_'), type: 'unknown' };
};

/**
 * Parse CSV text into structured company/employee data
 * @param {string} text - CSV content
 * @returns {Array} Array of company objects with employees
 */
export const parse = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    // Parse headers
    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map(normalizeHeader);

    // Group records by company
    const companyMap = new Map();

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        const record = {};
        const companyData = {};
        const employeeData = {};

        headers.forEach((header, idx) => {
            const value = values[idx] || '';
            record[header.key] = value;

            if (header.type === 'company') {
                companyData[header.key] = value;
            } else if (header.type === 'employee') {
                employeeData[header.key] = value;
            }
        });

        // Get company name and domain for grouping
        const companyName = companyData.name || record.name || 'N/A';
        const domain = companyData.domain || '';

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
                industry: companyData.industry || '',
                size: companyData.size || '',
                type: companyData.type || '',
                headquarters: companyData.headquarters || '',
                linkedin: companyData.linkedin || '',
                employees: []
            });
        }

        // Add employee if they have a name
        if (employeeData.firstName || employeeData.lastName) {
            companyMap.get(companyKey).employees.push({
                id: generateId(),
                firstName: employeeData.firstName || '',
                lastName: employeeData.lastName || '',
                email: employeeData.email || '',
                phone: employeeData.phone || '',
                jobTitle: employeeData.jobTitle || '',
                linkedin: employeeData.linkedin || '',
                location: employeeData.location || ''
            });
        }
    }

    return Array.from(companyMap.values());
};
