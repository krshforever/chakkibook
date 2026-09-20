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
    if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      console.warn('Firebase Auth Provider disabled in Console. Falling back to local auth mode.');
      // Local fallback user session object
      const fallbackUser = {
        uid: `user_${phone.replace(/\D/g, '')}`,
        email: email,
        isFallback: true
      };
      return fallbackUser;
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
    if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      console.warn('Firebase Auth Provider disabled in Console. Falling back to local auth mode.');
      const fallbackUser = {
        uid: `user_${phone.replace(/\D/g, '')}`,
        email: email,
        isFallback: true
      };
      return fallbackUser;
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
