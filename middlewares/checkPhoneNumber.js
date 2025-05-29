import { findPhoneNumbersInText } from 'libphonenumber-js';

export const checkProfanity = (text) => {
    const phoneMatches = findPhoneNumbersInText(text, 'IN');
    const phoneNumbers = phoneMatches.map(m => m.number.number);
    const hasPhoneNumber = phoneNumbers.length > 0;

    return hasPhoneNumber;
}