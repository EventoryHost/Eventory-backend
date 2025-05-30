import { findPhoneNumbersInText } from 'libphonenumber-js';

// Rename the function to match its purpose
export const checkProfanity = (text) => {
    if (!text || typeof text !== 'string') return false;
    
    try {
        const phoneMatches = findPhoneNumbersInText(text, 'IN');
        const phoneNumbers = phoneMatches.map(m => m.number.number);
        const hasPhoneNumber = phoneNumbers.length > 0;
        
        return hasPhoneNumber;
    } catch (error) {
        console.error("Error checking for phone numbers:", error);
        return false; // In case of error, let the message through
    }
}