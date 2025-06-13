import findEmails from 'find-emails-in-string';

// Rename the function to match its purpose
export const checkEmails = (text) => {
    if (!text || typeof text !== "string") return false;

    try {
        const emailMatches = findEmails(text);
        const hasEmail = emailMatches.length > 0;

        return hasEmail;
    } catch (error) {
        console.error("Error checking for Emails:", error);
        return false; // In case of error, let the message through
    }
};
