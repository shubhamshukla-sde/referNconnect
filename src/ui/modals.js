/**
 * UI Modals
 * Modal management for editing companies and employees
 */

/**
 * Field configurations for edit forms
 */
const COMPANY_FIELDS = [
    { label: 'Name', key: 'name' },
    { label: 'Domain', key: 'domain' },
    { label: 'Industry', key: 'industry' },
    { label: 'Size', key: 'size' },
    { label: 'Type', key: 'type' },
    { label: 'Headquarters', key: 'headquarters' },
    { label: 'LinkedIn', key: 'linkedin' }
];

const EMPLOYEE_FIELDS = [
    { label: 'First Name', key: 'firstName' },
    { label: 'Last Name', key: 'lastName' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Job Title', key: 'jobTitle' },
    { label: 'LinkedIn', key: 'linkedin' },
    { label: 'Location', key: 'location' }
];

/**
 * Open edit modal with form fields
 * @param {string} type - 'company' or 'employee'
 * @param {Object} targetData - Data to edit
 * @param {Function} onSave - Save callback (optional, functionality handled via global listeners)
 */
export const openEditModal = (type, targetData, onSave = null) => {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('modalForm');
    const title = document.getElementById('modalTitle');

    if (!modal || !form || !title) return;

    const fields = type === 'company' ? COMPANY_FIELDS : EMPLOYEE_FIELDS;
    title.textContent = type === 'company' ? 'Edit Company' : 'Edit Contact';

    form.innerHTML = fields.map(field => {
        let value = targetData[field.key] || '';

        // Fallback for employee fields if using old schema
        if (type === 'employee' && !value) {
            if (field.key === 'firstName') value = targetData.name?.split(' ')[0] || '';
            if (field.key === 'lastName') value = targetData.name?.split(' ').slice(1).join(' ') || '';
            if (field.key === 'jobTitle') value = targetData.title || '';
        }

        return `
            <div>
                <label style="display: block; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.4rem;">${field.label}</label>
                <input type="text" id="edit_${field.key}" value="${value}" class="input">
            </div>
        `;
    }).join('');

    modal.style.display = 'flex';
};

/**
 * Hide modal
 * @param {string} modalId - Modal element ID
 */
export const hideModal = (modalId = 'editModal') => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

/**
 * Get form values from edit modal
 * @param {string} type - 'company' or 'employee'
 * @returns {Object} Form values
 */
export const getEditFormValues = (type) => {
    const fields = type === 'company' ? COMPANY_FIELDS : EMPLOYEE_FIELDS;
    const values = {};

    fields.forEach(field => {
        const input = document.getElementById(`edit_${field.key}`);
        if (input) {
            values[field.key] = input.value;
        }
    });

    return values;
};
