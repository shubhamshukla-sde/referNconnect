/**
 * @module Firebase Service
 * Handles all Firestore database operations for companies and employees.
 * Uses shared Firebase config from config/index.js.
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import { FIREBASE_CONFIG } from '../config/index.js';
import { generateId } from '../utils/helpers.js';

// Reuse existing app if already initialized (prevents duplicate-app crashes)
const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const COMPANIES_COLLECTION = 'companies';

/**
 * Firebase Service with full CRUD operations
 */
export const FirebaseService = {
    /**
     * READ — Fetch all companies with their employees
     * @returns {Promise<Array>} Array of company objects
     */
    getAll: async () => {
        try {
            const companiesRef = collection(db, COMPANIES_COLLECTION);
            const snapshot = await getDocs(companiesRef);

            const companies = [];
            snapshot.forEach(doc => {
                companies.push({ ...doc.data(), id: doc.id });
            });

            console.log(`✅ Fetched ${companies.length} companies from Firebase`);
            return companies;
        } catch (error) {
            console.error('❌ Firebase getAll error:', error);
            throw error;
        }
    },

    /**
     * READ — Get a single company by ID
     * @param {string} companyId - Company document ID
     * @returns {Promise<Object|null>} Company object or null
     */
    getById: async (companyId) => {
        try {
            const docRef = doc(db, COMPANIES_COLLECTION, companyId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } : null;
        } catch (error) {
            console.error('❌ Firebase getById error:', error);
            throw error;
        }
    },

    /**
     * CREATE — Add a new company
     * @param {Object} companyData - Company data to add
     * @returns {Promise<Object>} Created company with ID
     */
    addCompany: async (companyData) => {
        try {
            const companiesRef = collection(db, COMPANIES_COLLECTION);
            const docRef = await addDoc(companiesRef, {
                ...companyData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log(`✅ Added company with ID: ${docRef.id}`);
            return { id: docRef.id, ...companyData };
        } catch (error) {
            console.error('❌ Firebase addCompany error:', error);
            throw error;
        }
    },

    /**
     * UPDATE — Update a company
     * @param {string} companyId - Company document ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    updateCompany: async (companyId, updates) => {
        try {
            const docRef = doc(db, COMPANIES_COLLECTION, companyId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            console.log(`✅ Updated company: ${companyId}`);
            return true;
        } catch (error) {
            console.error('❌ Firebase updateCompany error:', error);
            throw error;
        }
    },

    /**
     * DELETE — Remove a company
     * @param {string} companyId - Company document ID
     * @returns {Promise<boolean>} Success status
     */
    deleteCompany: async (companyId) => {
        try {
            const docRef = doc(db, COMPANIES_COLLECTION, companyId);
            await deleteDoc(docRef);
            console.log(`✅ Deleted company: ${companyId}`);
            return true;
        } catch (error) {
            console.error('❌ Firebase deleteCompany error:', error);
            throw error;
        }
    },

    /**
     * UPDATE — Update an employee within a company
     * @param {string} companyId - Company document ID
     * @param {string} employeeId - Employee ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    updateEmployee: async (companyId, employeeId, updates) => {
        try {
            const company = await FirebaseService.getById(companyId);
            if (!company) {
                throw new Error(`Company not found: ${companyId}`);
            }

            const employees = company.employees.map(emp =>
                emp.id === employeeId ? { ...emp, ...updates } : emp
            );

            await FirebaseService.updateCompany(companyId, { employees });
            console.log(`✅ Updated employee: ${employeeId}`);
            return true;
        } catch (error) {
            console.error('❌ Firebase updateEmployee error:', error);
            throw error;
        }
    },

    /**
     * DELETE — Remove an employee from a company
     * @param {string} companyId - Company document ID
     * @param {string} employeeId - Employee ID
     * @returns {Promise<boolean>} Success status
     */
    deleteEmployee: async (companyId, employeeId) => {
        try {
            const company = await FirebaseService.getById(companyId);
            if (!company) throw new Error('Company not found');

            const employees = company.employees.filter(emp => emp.id !== employeeId);
            await FirebaseService.updateCompany(companyId, { employees });
            console.log(`✅ Deleted employee: ${employeeId}`);
            return true;
        } catch (error) {
            console.error('❌ Firebase deleteEmployee error:', error);
            throw error;
        }
    },

    /**
     * CREATE — Add an employee to a company
     * @param {string} companyId - Company document ID
     * @param {Object} employeeData - Employee data
     * @returns {Promise<Object>} Created employee with ID
     */
    addEmployee: async (companyId, employeeData) => {
        try {
            const company = await FirebaseService.getById(companyId);
            if (!company) {
                throw new Error(`Company not found: ${companyId}`);
            }

            const newEmployee = { id: generateId(), ...employeeData };
            const employees = [...(company.employees || []), newEmployee];
            await FirebaseService.updateCompany(companyId, { employees });

            console.log(`✅ Added employee to company: ${companyId}`);
            return newEmployee;
        } catch (error) {
            console.error('❌ Firebase addEmployee error:', error);
            throw error;
        }
    },

    /**
     * BULK IMPORT — Import multiple companies
     * @param {Array} companies - Array of company objects
     * @returns {Promise<number>} Number of imported companies
     */
    bulkImport: async (companies) => {
        try {
            let imported = 0;
            for (const company of companies) {
                const { id, ...companyData } = company;
                await FirebaseService.addCompany(companyData);
                imported++;
            }
            console.log(`✅ Bulk imported ${imported} companies`);
            return imported;
        } catch (error) {
            console.error('❌ Firebase bulkImport error:', error);
            throw error;
        }
    },

    /**
     * CLEAR — Delete all companies (use with caution!)
     * @returns {Promise<boolean>} Success status
     */
    clearAll: async () => {
        try {
            const companies = await FirebaseService.getAll();
            for (const company of companies) {
                await FirebaseService.deleteCompany(company.id);
            }
            console.log('✅ Cleared all data from Firebase');
            return true;
        } catch (error) {
            console.error('❌ Firebase clearAll error:', error);
            throw error;
        }
    }
};

export default FirebaseService;
