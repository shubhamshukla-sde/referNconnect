/**
 * Application State
 * Centralized state management
 */

/**
 * Application state object
 */
export const state = {
    /** @type {Array} Array of company objects */
    data: [],

    /** @type {Object|null} Current editing target */
    editingTarget: null
};

/**
 * Reset state to initial values
 */
export const resetState = () => {
    state.data = [];
    state.editingTarget = null;
};

export default state;
