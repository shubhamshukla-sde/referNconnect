/**
 * @module Job Results Rendering
 * Pure HTML rendering functions for job search results.
 * No side effects — each function takes data and returns an HTML string.
 */

// ─── Matched Job Results (with resume) ────────────────────────

/**
 * Render job results with candidate skill/location info.
 * @param {Object} jobData - Job search results from AI
 * @param {Array<string>} allSkills - All candidate skills
 * @param {string} [candidateLocation=''] - Candidate's location
 * @param {Array<string>} [topSkills=[]] - Top in-demand skills
 * @returns {string} HTML string
 */
export const renderMatchedJobResults = (jobData, allSkills, candidateLocation = '', topSkills = []) => {
    let html = '';

    // Candidate info section — highlight top skills
    html += `
        <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1)); border-radius: 8px;">
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;">
                <div style="flex: 1; min-width: 200px;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">🔥 Top In-Demand Skills (${topSkills.length})</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem;">
                        ${topSkills.map(s => `<span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">${s}</span>`).join('')}
                    </div>
                    ${allSkills.length > topSkills.length ? `
                    <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.5rem;">
                        +${allSkills.length - topSkills.length} other skills: ${allSkills.filter(s => !topSkills.includes(s)).slice(0, 5).join(', ')}${allSkills.length - topSkills.length > 5 ? '...' : ''}
                    </div>
                    ` : ''}
                </div>
                ${candidateLocation ? `
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">📍 Location</div>
                    <div style="background: var(--surface); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.85rem;">${candidateLocation}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    // Search links or job posts
    html += renderSearchLinks(jobData);

    return html;
};

// ─── Basic Job Results (without resume) ───────────────────────

/**
 * Render job search results HTML (without resume matching).
 * @param {Object} jobData - Job search data from AI
 * @returns {string} HTML string
 */
export const renderJobResults = (jobData) => {
    const statusClass = jobData.hiringStatus?.toLowerCase().includes('active') ? 'active' :
        jobData.hiringStatus?.toLowerCase().includes('some') ? 'some' : 'none';

    let html = `
        <div style="margin-bottom: 1.5rem;">
            <span class="hiring-status ${statusClass}">${jobData.hiringStatus || 'Unknown'}</span>
        </div>
    `;

    // Search links or job posts
    html += renderSearchLinks(jobData);

    // Notes
    if (jobData.notes) {
        html += `
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--surface); border-radius: 8px; font-size: 0.85rem; color: var(--text-dim);">
                💡 ${jobData.notes}
            </div>
        `;
    }

    return html;
};

// ─── Shared Helpers ───────────────────────────────────────────

/**
 * Render search links or fallback job posts from AI response.
 * Shared by both matched and basic result renderers.
 * @param {Object} jobData
 * @returns {string} HTML string
 */
const renderSearchLinks = (jobData) => {
    // New searchLinks format (Google search cards)
    if (jobData.searchLinks?.length > 0) {
        let html = `
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-dim);">
                🔍 Click any search below to find LinkedIn posts on Google:
            </div>
            <div style="display: grid; gap: 0.75rem;">
        `;
        html += jobData.searchLinks.map(link => `
            <a href="${link.googleSearchUrl}" target="_blank" class="job-post-card" style="display: block; text-decoration: none; color: inherit; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
               onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';"
               onmouseout="this.style.transform='';this.style.boxShadow='';">
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    <div style="font-size: 1.5rem;">${link.icon || '🔍'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${link.title}</div>
                        <div style="font-size: 0.85rem; color: var(--text-dim);">${link.description}</div>
                        ${link.location ? `<div style="font-size: 0.75rem; color: #818cf8; margin-top: 0.25rem;">📍 ${link.location}</div>` : ''}
                    </div>
                    <div style="color: var(--primary); font-size: 1.2rem;">→</div>
                </div>
            </a>
        `).join('');
        html += `</div>`;
        return html;
    }

    // Fallback for old jobPosts format
    if (jobData.jobPosts?.length > 0) {
        return jobData.jobPosts.map(post => `
            <div class="job-post-card">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">${post.title || 'Job Opening'}</div>
                <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem;">
                    ${post.source ? `📍 ${post.source}` : ''} 
                    ${post.postedBy ? `• 👤 ${post.postedBy}` : ''}
                    ${post.date ? `• 📅 ${post.date}` : ''}
                </div>
                <div style="font-size: 0.9rem; margin-bottom: 0.75rem;">${post.summary || ''}</div>
                ${post.url ? `<a href="${post.url}" target="_blank" class="btn" style="display: inline-block; padding: 0.4rem 0.8rem; font-size: 0.8rem; text-decoration: none;">View Post →</a>` : ''}
            </div>
        `).join('');
    }

    // No results
    return `
        <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
            <div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>
            <div>No search links generated</div>
        </div>
    `;
};
