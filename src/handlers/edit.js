/**
 * Edit Handlers
 * Handles edit operations for companies and employees
 */

import { Storage, FirebaseService } from '../services/index.js';
import { getEditFormValues, hideModal } from '../ui/modals.js';

/**
 * Save edit (company or employee)
 * @param {Object} state - Application state
 * @param {Function} onComplete - Completion callback
 */
export const saveEdit = async (state, onComplete) => {
    if (!state.editingTarget) return;
    const { type, id, pid } = state.editingTarget;

    try {
        const updates = getEditFormValues(type);

        if (type === 'company') {
            await FirebaseService.updateCompany(id, updates);
            const company = state.data.find(c => c.id === id);
            Object.assign(company, updates);
        } else {
            await FirebaseService.updateEmployee(pid, id, updates);
            const company = state.data.find(c => c.id === pid);
            const emp = company.employees.find(e => e.id === id);
            Object.assign(emp, updates);
        }

        Storage.save(state.data);
        console.log('✅ Changes saved to Firebase');
    } catch (error) {
        console.error('❌ Save failed:', error);
        alert('Failed to save changes. Please try again.');
        return;
    }

    hideModal();
    state.editingTarget = null;
    onComplete?.(type, pid);
};

export default { saveEdit };
