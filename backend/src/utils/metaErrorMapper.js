/**
 * Maps Meta WhatsApp Business API error codes to human-friendly messages.
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes/
 */
const mapMetaError = (code, defaultMessage = 'Unknown delivery error') => {
    const errorMap = {
        '100': 'Invalid parameters (check phone number or template name)',
        '130429': 'Rate limit reached (sending too many messages too fast)',
        '131000': 'Service temporarily unavailable (try again later)',
        '131008': 'Template not found or not approved yet',
        '131009': 'Template parameter mismatch (check variables)',
        '131021': 'Receiver not in allowed list (Sandbox limitation)',
        '131026': 'Message body is too long',
        '131042': 'Media file is unreachable or unsupported (check link/format)',
        '131045': 'Incorrect parameter type (e.g. text instead of image)',
        '131048': 'Spam protection (message blocked by Meta)',
        '131049': 'Recipient unreachable (user has blocked you or invalid number)',
        '131051': 'File size is too large for WhatsApp',
        '131052': 'File type not supported',
        '131053': 'Media download failed (Meta could not fetch the file)',
        '131056': 'This phone number is not registered on WhatsApp',
        '132000': 'Template is currently disabled',
        '132001': 'Template quality is too low (blocked by Meta)',
        '132015': 'Template language not supported'
    };

    const errorCode = code ? String(code) : '';
    return errorMap[errorCode] || defaultMessage;
};

module.exports = { mapMetaError };
