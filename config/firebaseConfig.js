import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseAppInitialized = false;

function initializeFirebase() {
  if (firebaseAppInitialized || admin.apps.length > 0) {
    return admin;
  }

  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.resolve(process.cwd(),  "firebase-service-account.json");

  try {
    // Check if the service account file exists
    if (!fs.existsSync(serviceAccountPath)) {
      console.warn(
        "⚠️  Firebase service account file not found. Firebase features will be disabled."
      );
      console.warn(
        `   Expected path: ${serviceAccountPath}`
      );
      console.warn(
        "   To enable Firebase, either:"
      );
      console.warn(
        "   1. Place firebase-service-account.json in the root directory, or"
      );
      console.warn(
        "   2. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable"
      );
      return null;
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseAppInitialized = true;
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error.message);
    console.warn("⚠️  Firebase features will be disabled.");
    return null;
  }

  return admin;
}

export default initializeFirebase;
