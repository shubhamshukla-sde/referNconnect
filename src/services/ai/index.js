/**
 * @module AI Service
 * Barrel file — re-exports the public API from all AI sub-modules.
 * Consumers import from here; internal structure is an implementation detail.
 */

// Key management
export {
    getApiKey,
    saveApiKey,
    getGeminiKey,
    saveGeminiKey,
    getActiveProvider,
    saveResumeData,
    getResumeData,
    clearResumeData
} from './keys.js';

// Provider orchestration
export { callAI } from './providers.js';

// AI use-cases (prompt builders)
export {
    parseWithAI,
    searchJobPosts,
    parseResume,
    searchJobsWithResume
} from './prompts.js';

// Response parsers (for external use if needed)
export {
    extractAndParseJSON,
    normalizeData,
    extractJobSearchJSON,
    extractResumeJSON
} from './parsers.js';
