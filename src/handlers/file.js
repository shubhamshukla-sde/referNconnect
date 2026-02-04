/**
 * File Handlers
 * Handles file upload and parsing operations
 */

import { Storage, FirebaseService } from '../services/index.js';
import { parseCSV, parseJSON } from '../parsers/index.js';
import { showView } from '../ui/views.js';

/**
 * Handle file upload (CSV/JSON import)
 * @param {File} file - File to upload
 * @param {Object} state - Application state
 * @param {Function} onComplete - Completion callback
 */
export const handleFileUpload = async (file, state, onComplete) => {
    if (!file) return;

    try {
        const text = await file.text();

        // Parse based on file type
        let parsedData;
        if (file.name.endsWith('.json')) {
            parsedData = parseJSON(text);
        } else {
            parsedData = parseCSV(text);
        }

        // Import to Firebase
        console.log('📤 Importing data to Firebase...');
        await FirebaseService.bulkImport(parsedData);
        state.data = await FirebaseService.getAll();
        Storage.save(state.data);
        console.log(`✅ Imported ${parsedData.length} companies to Firebase`);
    } catch (error) {
        console.error('❌ Firebase import failed:', error);
        // Fallback to local storage
        Storage.save(state.data);
    }

    onComplete?.();
};

export default { handleFileUpload };
