/**
 * Auth Guard
 * Reusable login gate for protected pages (admin, restore)
 * 
 * Usage: import this module in any HTML page that needs auth protection.
 * It will automatically inject a login form and hide page content until authenticated.
 */

import { signInAdmin, signOutAdmin, onAuthChange } from './auth.js';

/**
 * Initialize auth guard on the current page
 * Hides #app, shows login form, and manages auth state
 */
export function initAuthGuard() {
    const appEl = document.getElementById('app') || document.querySelector('.container');
    if (!appEl) {
        console.error('Auth Guard: No #app or .container element found');
        return;
    }

    // Hide page content immediately
    appEl.style.display = 'none';

    // Inject login gate UI
    const gate = document.createElement('div');
    gate.id = 'authGate';
    gate.innerHTML = `
        <div class="auth-overlay">
            <div class="auth-card">
                <div class="auth-icon">🔐</div>
                <h2 class="auth-title">Admin Access</h2>
                <p class="auth-subtitle">Sign in to continue</p>
                <form id="authForm" autocomplete="on">
                    <input type="email" id="authEmail" class="auth-input" placeholder="Email" required autocomplete="email">
                    <input type="password" id="authPassword" class="auth-input" placeholder="Password" required autocomplete="current-password">
                    <div id="authError" class="auth-error"></div>
                    <button type="submit" id="authSubmit" class="auth-btn">Sign In</button>
                </form>
                <a href="../index.html" class="auth-back">← Back to Directory</a>
            </div>
        </div>
    `;
    document.body.prepend(gate);

    // Link external auth styles (avoids injecting ~100 lines of inline CSS)
    if (!document.querySelector('link[href*="auth.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../styles/auth.css';
        document.head.appendChild(link);
    }

    // Handle form submission
    const form = document.getElementById('authForm');
    const errorEl = document.getElementById('authError');
    const submitBtn = document.getElementById('authSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;

        errorEl.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
            await signInAdmin(email, password);
            // Auth state listener will handle the rest
        } catch (err) {
            const messages = {
                'auth/invalid-credential': 'Invalid email or password',
                'auth/user-not-found': 'No account with this email',
                'auth/wrong-password': 'Incorrect password',
                'auth/too-many-requests': 'Too many attempts. Try again later',
                'auth/invalid-email': 'Invalid email address',
                'auth/network-request-failed': 'Network error. Check connection'
            };
            errorEl.textContent = messages[err.code] || `Error: ${err.message}`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });

    // Listen for auth state
    onAuthChange((user) => {
        if (user) {
            // Authenticated — hide gate, show content
            gate.style.display = 'none';
            appEl.style.display = '';
            injectSignOutButton(user);
            console.log(`✅ Authenticated as ${user.email}`);
        } else {
            // Not authenticated — show gate, hide content
            gate.style.display = '';
            appEl.style.display = 'none';
            // Reset form
            form.reset();
            errorEl.textContent = '';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
}

/**
 * Inject a small sign-out button into the page toolbar/header
 */
function injectSignOutButton(user) {
    // Don't add twice
    if (document.getElementById('btnSignOut')) return;

    const btn = document.createElement('button');
    btn.id = 'btnSignOut';
    btn.className = 'signout-btn';
    btn.textContent = '🚪 Sign Out';
    btn.title = `Signed in as ${user.email}`;
    btn.addEventListener('click', async () => {
        await signOutAdmin();
        window.location.href = '../index.html';
    });

    // Try to find a toolbar to append to
    const toolbar = document.querySelector('.admin-toolbar') ||
        document.querySelector('.header-row') ||
        document.querySelector('header');
    if (toolbar) {
        toolbar.appendChild(btn);
    } else {
        // Fallback: fixed position top-right
        btn.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:100;';
        document.body.appendChild(btn);
    }
}

// Auto-initialize when this module is imported
initAuthGuard();
