/**
 * Referral Handlers
 * Handles referral email composition
 */

/**
 * Handle ask referral - open Gmail compose
 * @param {Object} emp - Employee object
 */
export const handleAskReferral = (emp) => {
    if (!emp.email) {
        alert('No email found for this contact.');
        return;
    }

    const subject = encodeURIComponent('Referral Inquiry');
    const body = encodeURIComponent(
        `Hi ${emp.firstName},\n\nI hope you're doing well.\n\n[Your message here]\n\nBest regards,\nShubham Shukla`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emp.email}&su=${subject}&body=${body}`;

    window.open(gmailUrl, '_blank');
};
