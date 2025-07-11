import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Helper function to properly format the private key
function formatPrivateKey(privateKey?: string): string {
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }
  
  // Replace escaped newlines with actual newlines
  let formattedKey = privateKey.replace(/\\n/g, '\n');
  
  // Remove any leading/trailing whitespace
  formattedKey = formattedKey.trim();
  
  // If the key doesn't have proper PEM headers, add them
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') && !formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    // Check if it's a multi-line key without headers
    if (formattedKey.includes('\n')) {
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
    } else {
      // Single line key, needs to be split properly
      formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
    }
  }
  
  return formattedKey;
}

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  }),
};

// Initialize Firebase Admin SDK
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const adminAuth = getAuth(app);

export { adminAuth, app };
