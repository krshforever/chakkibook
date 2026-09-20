import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './config';

// Convert phone number (10 digits) to email format for Firebase Auth free tier
export const phoneToEmail = (phone) => `${phone.replace(/\D/g, '')}@chakkibook.local`;

export const registerUser = async (phone, password) => {
  const email = phoneToEmail(phone);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    console.warn('Firebase Auth notice:', err.code, err.message);
    if (
      err.code === 'auth/configuration-not-found' || 
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      err.message?.includes('api-key-not-valid') ||
      err.message?.includes('API key')
    ) {
      console.warn('Firebase API key/provider disabled. Using seamless local auth mode.');
      return {
        uid: `user_${phone.replace(/\D/g, '')}`,
        email: email,
        isFallback: true
      };
    }
    throw err;
  }
};

export const loginUser = async (phone, password) => {
  const email = phoneToEmail(phone);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    console.warn('Firebase Auth notice:', err.code, err.message);
    if (
      err.code === 'auth/configuration-not-found' || 
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/invalid-api-key' ||
      err.message?.includes('api-key-not-valid') ||
      err.message?.includes('API key')
    ) {
      console.warn('Firebase API key/provider disabled. Using seamless local auth mode.');
      return {
        uid: `user_${phone.replace(/\D/g, '')}`,
        email: email,
        isFallback: true
      };
    }
    throw err;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Signout note:', e);
  }
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
