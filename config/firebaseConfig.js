import * as admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseAppInitialized = false;

function initializeFirebase() {
  if (firebaseAppInitialized || admin.apps.length > 0) {
    return admin;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(__dirname, '..', 'firebase-service-account.json');

  try {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add other Firebase configuration options if needed
    });

    firebaseAppInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }

  return admin;
}

export default initializeFirebase;
