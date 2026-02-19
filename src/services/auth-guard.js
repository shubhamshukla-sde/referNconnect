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

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        .auth-overlay {
            position: fixed;
            inset: 0;
            background: var(--bg, #0a0a0c);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 1.5rem;
        }
        .auth-card {
            width: 100%;
            max-width: 380px;
            text-align: center;
        }
        .auth-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .auth-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text, #f9fafb);
            margin-bottom: 0.3rem;
        }
        .auth-subtitle {
            color: var(--text-dim, #9ca3af);
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
        }
        .auth-input {
            width: 100%;
            padding: 0.85rem 1rem;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 0.75rem;
            color: var(--text, #f9fafb);
            font-size: 0.9rem;
            outline: none;
            margin-bottom: 0.75rem;
            transition: border-color 0.2s, box-shadow 0.2s;
            font-family: inherit;
        }
        .auth-input:focus {
            border-color: var(--primary, #818cf8);
            box-shadow: 0 0 0 3px rgba(129,140,248,0.15);
        }
        .auth-input::placeholder {
            color: var(--text-dim, #9ca3af);
        }
        .auth-error {
            color: #f87171;
            font-size: 0.8rem;
            min-height: 1.2rem;
            margin-bottom: 0.5rem;
            text-align: left;
        }
        .auth-btn {
            width: 100%;
            padding: 0.85rem;
            background: var(--primary, #818cf8);
            color: white;
            border: none;
            border-radius: 0.75rem;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }
        .auth-btn:hover:not(:disabled) {
            opacity: 0.9;
            transform: scale(1.01);
        }
        .auth-btn:disabled {
            opacity: 0.6;
            cursor: wait;
        }
        .auth-back {
            display: inline-block;
            margin-top: 1.25rem;
            color: var(--text-dim, #9ca3af);
            text-decoration: none;
            font-size: 0.82rem;
            transition: color 0.2s;
        }
        .auth-back:hover {
            color: var(--text, #f9fafb);
        }
        /* Sign out button injected into page header */
        .signout-btn {
            padding: 0.4rem 0.7rem;
            border-radius: 0.5rem;
            font-size: 0.78rem;
            cursor: pointer;
            border: 1px solid rgba(239,68,68,0.2);
            background: rgba(239,68,68,0.08);
            color: #f87171;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .signout-btn:hover {
            background: rgba(239,68,68,0.15);
            border-color: rgba(239,68,68,0.4);
        }
    `;
    document.head.appendChild(style);

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
