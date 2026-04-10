import api from '@/lib/api';

/**
 * Sends an Email campaign using backend API (Resend)
 * @param {string[]} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 * @param {string|null} invoiceId - Optional Invoice ID to link logs
 * @param {boolean} testMode - If true, marks logs as test or skips them depending on backend logic
 * @returns {Promise<{success: boolean, results: any[], error: string}>}
 */
export const sendEmailCampaign = async (recipients, subject, html, invoiceId = null, testMode = false) => {
  console.log("📧 [Email Service] Initiating sendEmailCampaign...");
  console.log(`ℹ️ [Email Service] Targets:`, recipients);
  console.log(`ℹ️ [Email Service] Subject: ${subject}`);
  
  // Validation
  if (!Array.isArray(recipients) || recipients.length === 0) {
    console.error("❌ [Email Service] Invalid recipients array");
    return { success: false, error: "Recipients must be a non-empty array" };
  }

  if (!subject || !html) {
    console.error("❌ [Email Service] Missing subject or body");
    return { success: false, error: "Subject and message body are required" };
  }

  try {
    console.log(`🚀 [Email Service] Calling backend /api/send-email...`);
    
    const data = await api.post('/api/send-email', {
      recipients,
      subject,
      html,
      invoice_id: invoiceId,
      test_mode: testMode
    });

    console.log("✅ [Email Service] Backend returned:", data);

    if (!data.success) {
        console.error("❌ [Email Service] Backend reported failure:", data.error);
        return { success: false, error: data.error };
    }

    return {
      success: true,
      results: data.results,
      message: "Emails processed"
    };

  } catch (error) {
    console.error("💥 [Email Service] Critical Network/Client Error:", error);
    return {
      success: false,
      error: error.message || "Network error occurred while sending email"
    };
  }
};