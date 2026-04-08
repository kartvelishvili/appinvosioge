/**
 * Sends an SMS campaign using the smsoffice.ge API
 * @param {string[]} numbers - Array of normalized phone numbers (9955XXXXXXXX)
 * @param {string} message - SMS content
 * @param {string|null} scheduledAt - UTC timestamp (optional)
 * @returns {Promise<{success: boolean, data: any, error: string, sms_ids: string[]}>}
 */
export const sendSMSCampaign = async (numbers, message, scheduledAt = null) => {
  const API_KEY = import.meta.env.VITE_SMSOFFICE_API_KEY || "1a41250ffb8a4891b96fdd807e873e86";
  const SENDER = "SmarketerGE";
  const API_URL = "https://smsoffice.ge/api/v2/send/";

  try {
    const formData = new FormData();
    formData.append("key", API_KEY);
    formData.append("destination", numbers.join(","));
    formData.append("sender", SENDER);
    formData.append("content", message);
    
    if (scheduledAt) {
      formData.append("urgent", "false");
      formData.append("scheduled_at", scheduledAt); 
    } else {
       formData.append("urgent", "true");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { success: false, message: responseText };
    }

    const isSuccess = 
        responseData.Success === true || 
        String(responseData.Success).toLowerCase() === 'true' || 
        responseData.success === true || 
        responseData.ErrorCode === 0;

    if (isSuccess) {
        const ids = (responseData.Output || responseData.id || "").toString().split(",").map(s => s.trim()).filter(Boolean);
        
        return {
            success: true,
            data: responseData,
            sms_ids: ids,
            message: responseData.Message || "Success"
        };
    } else {
        return {
            success: false,
            data: responseData,
            sms_ids: [],
            error: responseData.Message || "API Error"
        };
    }

  } catch (error) {
    console.error("SMS Campaign Error:", error);
    return {
      success: false,
      error: error.message || "Network Error",
      sms_ids: []
    };
  }
};

/**
 * Normalizes phone number to 995XXXXXXXXX format
 * @param {string} phone 
 * @returns {string|null} normalized phone or null if invalid
 */
export const normalizePhoneNumber = (phone) => {
    if (typeof phone !== 'string' || !phone) return null;
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // if it's a local number like 599123456
    if (cleaned.length === 9 && cleaned.startsWith('5')) {
        return '995' + cleaned;
    }
    
    // if it's a local number with leading zero like 0599123456
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return '995' + cleaned.substring(1);
    }

    // if it's already in the correct format with country code
    if (cleaned.length === 12 && cleaned.startsWith('995')) {
        return cleaned;
    }
    
    // Fallback for other potential cases, but might be invalid
    // If it starts with 00, treat as international prefix
    if (cleaned.startsWith('00')) {
        const international = cleaned.substring(2);
        // Only return if it seems like a valid length after stripping 00
        if (international.length >= 9) {
            return international;
        }
    }
    
    // If we've reached here, the number is in an unrecognized format.
    // Return null to indicate it's not a valid/supported format.
    return null;
};

/**
 * Calculates the number of SMS segments for a given message.
 * @param {string} message - The SMS message content.
 * @returns {{encoding: string, count: number, segments: number}}
 */
export const countSmsSegments = (message) => {
    if (typeof message !== 'string') {
        return { encoding: 'unknown', count: 0, segments: 0 };
    }
    const gsm7bitChars = "@£$¥èéùìòÇ\\nØø\\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
    const gsm7bitExChars = "^{}\\\\[~\\]|€";

    let isGsm = true;
    let extendedCharsCount = 0;

    for (let i = 0; i < message.length; i++) {
        const char = message[i];
        if (gsm7bitChars.indexOf(char) === -1) {
            if (gsm7bitExChars.indexOf(char) !== -1) {
                extendedCharsCount++;
            } else {
                isGsm = false;
                break;
            }
        }
    }

    const count = message.length + extendedCharsCount;

    if (isGsm) {
        if (count <= 160) {
            return { encoding: 'GSM-7', count: message.length, segments: 1 };
        } else {
            return { encoding: 'GSM-7', count: message.length, segments: Math.ceil(count / 153) };
        }
    } else {
        if (message.length <= 70) {
            return { encoding: 'UCS-2', count: message.length, segments: 1 };
        } else {
            return { encoding: 'UCS-2', count: message.length, segments: Math.ceil(message.length / 67) };
        }
    }
};