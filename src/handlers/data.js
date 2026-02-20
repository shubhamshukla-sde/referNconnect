/**
 * Data Handlers
 * Handles data initialization and clearing
 */

import { Storage, FirebaseService } from '../services/index.js';
import { showView } from '../ui/views.js';

/**
 * Initialize app - load data from Firebase or localStorage
 * @param {Object} state - Application state
 * @returns {Promise<boolean>} True if data was loaded
 */
export const initializeData = async (state) => {
    try {
        console.log('🔄 Fetching data from Firebase...');
        const firebaseData = await FirebaseService.getAll();
        if (firebaseData && firebaseData.length > 0) {
            state.data = firebaseData;
            Storage.save(firebaseData);
            console.log(`✅ Loaded ${state.data.length} companies from Firebase`);
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Firebase fetch failed, using local data:', error.message);
    }

    // Fallback to local storage
    state.data = Storage.load();
    return state.data.length > 0;
};
/**
 * Handle clear all data
 * @param {Object} state - Application state
 * @param {Function} onComplete - Completion callback
 */
export const handleClear = (state, onComplete) => {
    const modal = document.getElementById('confirmModal');
    const cancelBtn = document.getElementById('btnCancelConfirm');
    const executeBtn = document.getElementById('btnExecuteConfirm');
    const confirmInput = document.getElementById('confirmInput');

    if (!modal || !cancelBtn || !executeBtn || !confirmInput) return;

    // Reset state
    confirmInput.value = '';
    executeBtn.disabled = true;
    modal.style.display = 'flex';

    // Enable button only when user types DELETE
    const onInput = () => {
        executeBtn.disabled = confirmInput.value.toUpperCase() !== 'DELETE';
    };

    const hide = () => {
        modal.style.display = 'none';
        confirmInput.value = '';
        executeBtn.disabled = true;
        // Cleanup listeners
        executeBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', hide);
        confirmInput.removeEventListener('input', onInput);
    };

    const onConfirm = async () => {
        if (confirmInput.value.toUpperCase() !== 'DELETE') return;

        try {
            executeBtn.innerText = 'Clearing...';
            executeBtn.disabled = true;
            await FirebaseService.clearAll();
            Storage.clear();
            state.data = [];
            hide();
            onComplete?.();
            console.log('✅ Cleared all data');
        } catch (error) {
            console.error('❌ Clear failed:', error);
            alert('Failed to clear data: ' + error.message);
        } finally {
            executeBtn.innerText = 'Clear Data';
            executeBtn.disabled = false;
        }
    };

    confirmInput.addEventListener('input', onInput);
    executeBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', hide);
};
