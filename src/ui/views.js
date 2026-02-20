/**
 * Show a specific view and hide others
 * @param {string} viewId - ID of view to show
 * @param {Function} onDirectoryShow - Callback when showing directory
 */
export const showView = (viewId, onDirectoryShow = null) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId)?.classList.add('active');

    // Use CSS class for smooth animated visibility
    const navActions = document.getElementById('navActions');
    if (navActions) {
        if (viewId === 'viewLanding') {
            navActions.classList.remove('visible');
        } else {
            navActions.classList.add('visible');
        }
    }

    if (viewId === 'viewDirectory' && onDirectoryShow) {
        onDirectoryShow();
    }
};

/**
 * Get the currently active view ID
 * @returns {string} Active view ID
 */
export const getActiveView = () => {
    const activeView = document.querySelector('.view.active');
    return activeView?.id || 'viewLanding';
};
