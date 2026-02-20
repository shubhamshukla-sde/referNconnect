/**
 * Admin Page - Data Import Logic
 * Handles AI-powered data import and Firebase operations
 */

import { FirebaseService, Storage } from '../services/index.js';
import { getApiKey, saveApiKey, getGeminiKey, saveGeminiKey, getActiveProvider, parseWithAI } from '../services/ai/index.js';
import { generateId, findMatchingEmployee, mergeEmployeeData } from '../utils/helpers.js';

// State
let currentDataType = 'text';
let parsedData = null;

/**
 * Log message to activity log
 */
const log = (message, type = 'info') => {
    console.log(`[Admin Log] ${type}: ${message}`);
    const logEl = document.getElementById('logContent');
    if (!logEl) return;
    const timestamp = new Date().toLocaleTimeString();
    const icon = { info: 'ℹ️', success: '✅', error: '❌', processing: '⏳' }[type] || 'ℹ️';
    logEl.innerHTML = `<div>${icon} [${timestamp}] ${message}</div>` + logEl.innerHTML;
};

/**
 * Set status badge
 */
const setStatus = (status, text) => {
    const badge = document.getElementById('statusBadge');
    if (badge) {
        badge.className = `status-badge status-${status}`;
        badge.textContent = text;
    }
};

/**
 * Load API keys from storage & show active provider
 */
const loadApiKeys = () => {
    const pKey = getApiKey();
    if (pKey) {
        const input = document.getElementById('apiKeyInput');
        if (input) input.value = pKey;
    }
    const gKey = getGeminiKey();
    if (gKey) {
        const input = document.getElementById('geminiKeyInput');
        if (input) input.value = gKey;
    }
    updateProviderBadge();
    if (pKey || gKey) log(`AI provider: ${getActiveProvider()?.provider || 'none'}`, 'info');
};

/** Update provider badge in UI */
const updateProviderBadge = () => {
    const badge = document.getElementById('providerBadge');
    if (!badge) return;
    const active = getActiveProvider();
    if (!active) { badge.className = 'provider-badge none'; badge.textContent = 'No key'; }
    else if (active.provider === 'perplexity') { badge.className = 'provider-badge perplexity'; badge.textContent = '⚡ Perplexity'; }
    else { badge.className = 'provider-badge gemini'; badge.textContent = '✦ Gemini'; }
};

/**
 * Deduplicate entire database
 */
const deduplicateDatabase = async () => {
    console.log('Deduplicate button clicked');
    // REMOVED confirm() for testing, adding explicit start log
    setStatus('processing', 'Cleaning...');
    log('Starting database deduplication process...', 'processing');

    try {
        log('Fetching all companies from Firebase...', 'info');
        const companies = await FirebaseService.getAll();
        console.log(`Fetched ${companies.length} companies`);

        let totalMergedCount = 0;

        for (const company of companies) {
            if (!company.employees || company.employees.length <= 1) {
                console.log(`Skipping ${company.name} - no employees or only one`);
                continue;
            }

            log(`Checking duplicates in ${company.name}...`, 'info');
            const originalCount = company.employees.length;
            const uniqueEmployees = [];

            for (const emp of company.employees) {
                const match = findMatchingEmployee(uniqueEmployees, emp);
                if (match) {
                    const index = uniqueEmployees.indexOf(match);
                    uniqueEmployees[index] = mergeEmployeeData(match, emp);
                    log(`Merging record for: ${emp.firstName} ${emp.lastName}`, 'info');
                } else {
                    uniqueEmployees.push(emp);
                }
            }

            if (uniqueEmployees.length < originalCount) {
                const mergedInThisCompany = originalCount - uniqueEmployees.length;
                log(`Updating ${company.name} with ${uniqueEmployees.length} unique employees (removed ${mergedInThisCompany})`, 'processing');
                await FirebaseService.updateCompany(company.id, { employees: uniqueEmployees });
                totalMergedCount += mergedInThisCompany;
            }
        }

        log('Syncing local storage cache...', 'info');
        const allData = await FirebaseService.getAll();
        Storage.save(allData);

        log(`Deduplication complete! Total duplicates removed: ${totalMergedCount}`, 'success');
        setStatus('success', 'Cleanup Complete');
    } catch (error) {
        console.error('Deduplication Error:', error);
        log(`Deduplication Error: ${error.message}`, 'error');
        setStatus('error', 'Cleanup Failed');
    }
};

/**
 * Toggle phone number visibility for all employees
 * Uses button label to determine action: Lock → hide phones, Unlock → show phones
 */
const togglePhoneLock = async () => {
    const btn = document.getElementById('btnLockPhones');
    // Determine action from button: if it says "Lock", we need to lock (hide)
    const shouldLock = btn?.textContent?.includes('Lock Phones');
    const action = shouldLock ? 'Locking' : 'Unlocking';

    setStatus('processing', `${action} phones...`);
    log(`${action} all phone numbers...`, 'processing');

    try {
        const companies = await FirebaseService.getAll();
        let count = 0;

        for (const company of companies) {
            if (!company.employees || company.employees.length === 0) continue;

            const updatedEmployees = company.employees.map(emp => {
                if (emp.phone) {
                    count++;
                    return { ...emp, phoneLocked: shouldLock };
                }
                return emp;
            });

            await FirebaseService.updateCompany(company.id, { employees: updatedEmployees });
        }

        // Sync local cache
        const allData = await FirebaseService.getAll();
        Storage.save(allData);

        // Flip button label
        if (btn) btn.innerHTML = shouldLock ? '🔓 Unlock Phones' : '🔒 Lock Phones';

        log(`Done! ${shouldLock ? 'Locked' : 'Unlocked'} ${count} phone numbers`, 'success');
        setStatus('success', shouldLock ? 'Phones Hidden' : 'Phones Visible');
    } catch (error) {
        console.error('Toggle phone lock error:', error);
        log(`Error: ${error.message}`, 'error');
        setStatus('error', 'Toggle Failed');
    }
};

/**
 * Setup event listeners
 */
const setupEventListeners = () => {
    console.log('Setting up event listeners...');

    // Perplexity API Key
    document.getElementById('btnSaveKey')?.addEventListener('click', () => {
        const key = document.getElementById('apiKeyInput').value.trim();
        if (key) {
            saveApiKey(key);
            log('Perplexity API key saved', 'success');
            updateProviderBadge();
        }
    });

    // Gemini API Key
    document.getElementById('btnSaveGeminiKey')?.addEventListener('click', () => {
        const key = document.getElementById('geminiKeyInput').value.trim();
        if (key) {
            saveGeminiKey(key);
            log('Gemini API key saved', 'success');
            updateProviderBadge();
        }
    });

    // Data type tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDataType = tab.dataset.type;
        });
    });

    // File upload, AI process, Import
    document.getElementById('fileUpload')?.addEventListener('change', handleFileUpload);
    document.getElementById('btnProcessAI')?.addEventListener('click', processWithAI);
    document.getElementById('btnImport')?.addEventListener('click', importToFirebase);

    // DEDUPLICATE BUTTON
    const btnDedup = document.getElementById('btnDeduplicate');
    if (btnDedup) {
        console.log('Found btnDeduplicate, attaching listener');
        btnDedup.onclick = (e) => {
            e.preventDefault();
            deduplicateDatabase();
        };
    } else {
        console.error('CRITICAL: btnDeduplicate not found in DOM');
    }

    // LOCK PHONES BUTTON
    document.getElementById('btnLockPhones')?.addEventListener('click', togglePhoneLock);

    // Edit Mode Toggle
    const toggleEditMode = document.getElementById('toggleEditMode');
    if (toggleEditMode) {
        // Initialize from storage
        const isEditMode = localStorage.getItem('editMode') === 'true';
        toggleEditMode.checked = isEditMode;

        // Add listener
        toggleEditMode.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            localStorage.setItem('editMode', enabled);
            log(`Edit mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
        });
    }
};

/**
 * Handle file upload
 */
const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    document.getElementById('dataInput').value = text;

    if (file.name.endsWith('.json')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-type="json"]')?.classList.add('active');
        currentDataType = 'json';
    } else if (file.name.endsWith('.csv')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-type="csv"]')?.classList.add('active');
        currentDataType = 'csv';
    }

    log(`Loaded file: ${file.name}`, 'success');
};

/**
 * Render preview
 */
const renderPreview = (data) => {
    const section = document.getElementById('previewSection');
    const content = document.getElementById('previewContent');
    if (!section || !content) return;

    const totalEmployees = data.reduce((sum, c) => sum + (c.employees?.length || 0), 0);

    let html = `<p style="margin-bottom: 1rem; color: var(--text-dim);">Found <strong>${data.length}</strong> companies with <strong>${totalEmployees}</strong> employees</p>`;

    html += '<table class="parsed-table"><thead><tr><th>Company</th><th>Industry</th><th>Employees</th></tr></thead><tbody>';
    data.forEach(c => {
        html += `<tr><td><strong>${c.name}</strong><br><span style="color: var(--text-dim);">${c.domain}</span></td><td>${c.industry || '-'}</td><td>${c.employees?.length || 0}</td></tr>`;
    });
    html += '</tbody></table>';

    html += '<h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Employee Preview</h4>';
    html += '<table class="parsed-table"><thead><tr><th>Name</th><th>Company</th><th>Title</th><th>Email</th><th>Phone</th><th>Location</th></tr></thead><tbody>';
    data.forEach(company => {
        (company.employees || []).slice(0, 5).forEach(emp => {
            html += `<tr><td>${emp.firstName} ${emp.lastName}</td><td>${company.name}</td><td>${emp.jobTitle || 'N/A'}</td><td>${emp.email || 'N/A'}</td><td>${emp.phone || '-'}</td><td>${emp.location || '-'}</td></tr>`;
        });
    });
    html += '</tbody></table>';

    content.innerHTML = html;
    section.style.display = 'block';
};

/**
 * Process data with AI
 */
const processWithAI = async () => {
    const input = document.getElementById('dataInput').value.trim();
    if (!input) {
        log('No data to process', 'error');
        return;
    }

    setStatus('processing', 'Processing...');

    try {
        log('Sending data to Perplexity AI...', 'processing');
        parsedData = await parseWithAI(input, currentDataType);
        log(`Parsed ${parsedData.length} companies successfully`, 'success');
        setStatus('success', 'Parsing Complete');
        renderPreview(parsedData);
    } catch (error) {
        log(`AI Error: ${error.message}`, 'error');
        setStatus('error', 'Error');
    }
};

/**
 * Import to Firebase
 */
const importToFirebase = async () => {
    if (!parsedData || parsedData.length === 0) {
        log('No data to import', 'error');
        return;
    }

    setStatus('processing', 'Importing...');
    log('Starting Firebase import...', 'processing');

    try {
        const existing = await FirebaseService.getAll();
        const existingMap = new Map(existing.map(c => [c.name.toLowerCase(), c]));

        let updated = 0, created = 0, employeesUpdated = 0;

        for (const company of parsedData) {
            const key = company.name.toLowerCase();
            console.log(`Processing company: ${company.name} (key: ${key})`);

            if (existingMap.has(key)) {
                const existingCompany = existingMap.get(key);
                console.log(`Found existing company: ${existingCompany.name} with ID: ${existingCompany.id}`);
                // Build the full updated employee list in memory
                const employeeList = [...(existingCompany.employees || [])];

                for (const newEmp of (company.employees || [])) {
                    const match = findMatchingEmployee(employeeList, newEmp);

                    if (match) {
                        // Merge and replace in-place in the array
                        const mergedEmp = mergeEmployeeData(match, newEmp);
                        // Ensure the merged employee keeps the existing ID (or gets one)
                        mergedEmp.id = match.id || mergedEmp.id || generateId();
                        const idx = employeeList.indexOf(match);
                        employeeList[idx] = mergedEmp;
                        console.log(`Merged employee: ${mergedEmp.firstName} ${mergedEmp.lastName} | phone: ${mergedEmp.phone}`);
                        employeesUpdated++;
                        log(`Updated: ${mergedEmp.firstName} ${mergedEmp.lastName}`, 'info');
                    } else {
                        // Ensure new employee has an ID
                        const newEmployee = { ...newEmp, id: newEmp.id || generateId() };
                        employeeList.push(newEmployee);
                        updated++;
                        log(`Added: ${newEmployee.firstName} ${newEmployee.lastName}`, 'info');
                    }
                }

                // Single write per company with the full updated employee list
                await FirebaseService.updateCompany(existingCompany.id, { employees: employeeList });
                console.log(`✅ Wrote ${employeeList.length} employees for ${existingCompany.name}`);
            } else {
                console.log(`Creating new company: ${company.name}`);
                await FirebaseService.addCompany(company);
                created++;
                log(`Created: ${company.name}`, 'info');
            }
        }

        const allData = await FirebaseService.getAll();
        Storage.save(allData);

        log(`Import complete: ${created} new, ${updated} added, ${employeesUpdated} updated`, 'success');
        setStatus('success', 'Import Complete');
    } catch (error) {
        log(`Import Error: ${error.message}`, 'error');
        setStatus('error', 'Import Failed');
    }
};

/**
 * Initialize admin page
 */
const init = async () => {
    console.log('Initializing Admin script...');
    setupEventListeners();
    loadApiKeys();

    // Sync Lock Phones button label with current Firebase state
    try {
        const companies = await FirebaseService.getAll();
        const anyLocked = companies.some(c =>
            (c.employees || []).some(emp => emp.phoneLocked)
        );
        const btn = document.getElementById('btnLockPhones');
        if (btn) btn.innerHTML = anyLocked ? '🔓 Unlock Phones' : '🔒 Lock Phones';
    } catch (e) {
        console.warn('Could not sync phone lock state:', e.message);
    }

    log('Admin panel ready', 'info');
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
