import { supabase } from '@/lib/customSupabaseClient';

/**
 * Sends an Email campaign using Supabase Edge Function (Resend API)
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
    console.log(`🚀 [Email Service] Invoking 'send-email' edge function...`);
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        recipients,
        subject,
        html, // Passed as 'html' to match Edge Function expectation
        invoice_id: invoiceId,
        test_mode: testMode
      }
    });

    if (error) {
      console.error("❌ [Email Service] Edge Function Invocation Error:", error);
      // Try to parse the error body if available
      let errorMsg = error.message;
      try {
         if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body.error) errorMsg = body.error;
         } else if (typeof error === 'string') {
             const parsed = JSON.parse(error);
             if (parsed.error) errorMsg = parsed.error;
         }
      } catch(e) {
         console.warn("Error parsing failed:", e);
      }
      throw new Error(errorMsg || "Failed to invoke email service");
    }

    console.log("✅ [Email Service] Edge Function returned:", data);

    if (!data.success) {
        console.error("❌ [Email Service] Edge Function reported failure:", data.error);
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