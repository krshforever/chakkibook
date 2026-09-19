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
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginUser = async (phone, password) => {
  const email = phoneToEmail(phone);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
