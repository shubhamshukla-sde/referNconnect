/**
 * Utility Helpers
 * Common utility functions used across the application
 */

/**
 * Generate unique ID with fallback for older browsers
 * @returns {string} Unique identifier
 */
export const generateId = () => {
    try {
        return crypto.randomUUID();
    } catch {
        return 'id-' + Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
};

/**
 * Format URL to ensure it has a protocol
 * @param {string} url - URL to format
 * @returns {string} Formatted URL with protocol
 */
export const formatUrl = (url) => {
    if (!url) return '#';
    url = url.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return 'https://' + url;
};

/**
 * Format size to k format (e.g., 2000 -> 2k, 25000 -> 25k)
 * @param {string|number} size - Size to format
 * @returns {string} Formatted size
 */
export const formatSize = (size) => {
    if (!size) return '';
    const numStr = String(size).replace(/[^0-9]/g, '');
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return size;
    if (num >= 1000000) return Math.round(num / 1000000) + 'M';
    if (num >= 1000) return Math.round(num / 1000) + 'k';
    return numStr;
};

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Safe JSON parse with fallback
 * @param {string} str - JSON string to parse
 * @param {*} fallback - Fallback value on error
 * @returns {*} Parsed value or fallback
 */
export const safeJsonParse = (str, fallback = null) => {
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
};

/**
 * Check if value is empty (null, undefined, empty string, or placeholder)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        // Treat common placeholders as empty
        return v === '' || v === 'n/a' || v === '-' ||
            v === 'no email' || v === 'no phone' ||
            v === 'unknown' || v === 'no email found' ||
            v.includes('not revealed') ||
            v.includes('no phone');
    }
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Normalizes a string for robust comparison
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export const normalizeString = (str) => {
    if (!str) return '';
    return str.toLowerCase()
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
        .replace(/\s+/g, " "); // Normalize whitespace
};

/**
 * Normalizes a LinkedIn URL to its core profile identifier
 * @param {string} url - LinkedIn URL or slug
 * @returns {string} Normalized identifier
 */
const normalizeLinkedIn = (url) => {
    if (isEmpty(url)) return '';
    return url.toLowerCase()
        .trim()
        .replace(/\/$/, '')
        .replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '')
        .replace(/linkedin\.com\/in\//, '');
};

/**
 * Merges two employee objects, preferring non-empty and more detailed values.
 * @param {Object} target - Base employee object
 * @param {Object} source - New employee data
 * @returns {Object} Merged object
 */
export const mergeEmployeeData = (target, source) => {
    const merged = { ...target };
    const fields = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'linkedin', 'location'];

    fields.forEach(field => {
        const val1 = target[field];
        const val2 = source[field];

        if (isEmpty(val1) && !isEmpty(val2)) {
            merged[field] = val2;
        } else if (!isEmpty(val1) && !isEmpty(val2)) {
            // For phone: prefer new (source) value since user is importing updated data
            if (field === 'phone') {
                const digits1 = String(val1).replace(/\D/g, '');
                const digits2 = String(val2).replace(/\D/g, '');
                // Update if digits are different (new data takes priority)
                if (digits2 !== digits1) {
                    merged[field] = val2;
                }
            } else {
                // Prefer the longer/more detailed string (except for names where we keep target)
                if (field !== 'firstName' && field !== 'lastName' && String(val2).length > String(val1).length) {
                    merged[field] = val2;
                }
            }
        }
    });

    return merged;
};

/**
 * Robustly matches employees across several criteria
 * @param {Array} employeeList - List to search in
 * @param {Object} newEmp - New employee to find
 * @returns {Object|null} Match or null
 */
export const findMatchingEmployee = (employeeList, newEmp) => {
    if (!Array.isArray(employeeList)) return null;

    const nFirst = normalizeString(newEmp.firstName);
    const nLast = normalizeString(newEmp.lastName);
    const nFull = `${nFirst} ${nLast}`.trim();
    const nTitle = normalizeString(newEmp.jobTitle);

    return employeeList.find(existingEmp => {
        // 1. Email match (Strongest)
        if (!isEmpty(newEmp.email) && !isEmpty(existingEmp.email)) {
            if (newEmp.email.toLowerCase().trim() === existingEmp.email.toLowerCase().trim()) return true;
        }

        // 2. Phone match (Strong)
        if (!isEmpty(newEmp.phone) && !isEmpty(existingEmp.phone)) {
            const p1 = String(newEmp.phone).replace(/\D/g, '');
            const p2 = String(existingEmp.phone).replace(/\D/g, '');
            if (p1 && p1 === p2) return true;
        }

        // 3. LinkedIn match
        if (!isEmpty(newEmp.linkedin) && !isEmpty(existingEmp.linkedin)) {
            const l1 = normalizeLinkedIn(newEmp.linkedin);
            const l2 = normalizeLinkedIn(existingEmp.linkedin);
            if (l1 && l1 === l2) return true;
        }

        // 4. Name + Title fuzzy match (Medium)
        const eFirst = normalizeString(existingEmp.firstName);
        const eLast = normalizeString(existingEmp.lastName);
        const eFull = `${eFirst} ${eLast}`.trim();
        const eTitle = normalizeString(existingEmp.jobTitle);

        if (nFull === eFull && nFull !== '') {
            // One is a subset of the other (identical name, matching or missing other info)
            // Fuzzy title match
            const titlesMatch = nTitle === eTitle || (nTitle && eTitle && (nTitle.includes(eTitle) || eTitle.includes(nTitle)));

            if (titlesMatch || isEmpty(nTitle) || isEmpty(eTitle)) {
                return true;
            }
        }

        return false;
    }) || null;
};

export default {
    generateId,
    formatUrl,
    formatSize,
    debounce,
    safeJsonParse,
    isEmpty,
    normalizeString,
    mergeEmployeeData,
    findMatchingEmployee
};
