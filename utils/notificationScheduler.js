// Path updated to correctly point to the workers folder

import { startNotificationWorker } from "../workers/notificationWorker.js";

/**
 * Utility function to initialize all background workers.
 * Call this function once in your main server entry point after DB connection.
 */
export const initializeWorkers = () => {
    // Start the chat notification worker
    startNotificationWorker();
    
    console.log("All background workers have been initialized.");
};