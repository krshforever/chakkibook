import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Dedicated Production Firebase Config (Auto-Provisioned via Firebase CLI Token)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA_rhTN98EoPTFatlrwmLMjmmBwXc2-t3s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chakkibook-app-1291.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chakkibook-app-1291",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chakkibook-app-1291.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "223609479640",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:223609479640:web:4d07664759fd3f590212ad"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export default app;
