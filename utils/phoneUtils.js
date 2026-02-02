/**
 * Normalizes a phone number by keeping only the last 10 digits.
 * Removes all non-digit characters (including '+') and returns the last 10 digits.
 * 
 * @param {string} phone - The phone number to normalize.
 * @returns {string} The normalized 10-digit phone number.
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return phone;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Keep only the last 10 digits
  return digits.length > 10 ? digits.slice(-10) : digits;
};
