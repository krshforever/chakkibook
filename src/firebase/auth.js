/**
 * Firebase Auth: Google sign-in and phone OTP.
 *
 * This replaces the phone→email/password scheme that was here before. That
 * scheme existed only because `createUserWithEmailAndPassword` is free while
 * SMS OTP was not, and it shaped the whole product around a workaround: a mill
 * operator had to invent and remember a password before reaching the voice UI.
 *
 * Both providers below are first-class and converge on one shop-resolution
 * path, so it does not matter which one a user picks.
 *
 * Two domain notes that bite in practice:
 *
 *  - Firebase Auth only accepts sign-ins from domains listed in the Firebase
 *    Console under Authentication → Settings → Authorized domains. `localhost`
 *    works out of the box; a LAN IP like 192.168.31.132 must be added manually
 *    or Google sign-in fails with auth/unauthorized-domain.
 *
 *  - Phone auth on the web requires a reCAPTCHA verifier. It renders invisibly
 *    but still needs the DOM to be ready and the origin to be authorized.
 */

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from './config';

/**
 * Convert a 10-digit Indian mobile number to E.164.
 * The app assumes Indian numbers throughout (+91), so this is safe here.
 */
export function toE164(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  // Already has a country code.
  if (digits.length > 10) return `+${digits}`;
  return `+91${digits}`;
}

export const phoneToEmail = (phone) => `${String(phone || '').replace(/\D/g, '')}@chakkibook.local`;

const googleProvider = () => {
  const p = new GoogleAuthProvider();
  // Forces the account chooser even when already signed into one Google
  // session. Multi-user phones are common in a family shop.
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
};

/**
 * Sign in with Google.
 *
 * Popup first, redirect fallback. Popup is blocked on plenty of mobile
 * browsers and in-app webviews, and the failure mode there is silent — the
 * window simply never opens. Redirect always works but loses the in-app state,
 * so `getRedirectResult` must be called on load to recover it.
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider());
    return result.user;
  } catch (err) {
    if (err && err.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider());
      return null; // resolves after the redirect returns
    }
    if (err && err.code === 'auth/cancelled-popup-request') {
      // A second popup opened while the first was still pending.
      return null;
    }
    throw err;
  }
}

/** Recover the user after a redirect-based Google sign-in. */
export async function resolveGoogleRedirect() {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    // auth/no-auth-event just means nobody was redirected here. Not an error.
    if (err && err.code === 'auth/no-auth-event') return null;
    throw err;
  }
}

/**
 * Attach an invisible reCAPTCHA for phone auth.
 *
 * `containerId` must point at a real, mounted element — the verifier inserts
 * itself into the DOM, and calling this during render throws. Keep one
 * instance per login attempt and clear it afterwards.
 */
export function attachRecaptcha(containerId) {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
}

/**
 * Send an OTP to a phone number.
 *
 * Returns the confirmation result, which must be passed to `confirmOtp` —
 * the verification id is not stable across a re-render, so the caller holds it
 * in state (or a ref) rather than deriving it.
 */
export async function sendOtp(phoneNumber, verifier) {
  const confirmation = await signInWithPhoneNumber(auth, toE164(phoneNumber), verifier);
  return confirmation;
}

export async function confirmOtp(confirmationResult, code) {
  const result = await confirmationResult.confirm(String(code || '').trim());
  return result.user;
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Signout note:', e);
  }
}

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

/**
 * Email/password sign-in, keyed on the operator's mobile number.
 *
 * Firebase Auth's free tier has no SMS provider, so a 10-digit mobile number
 * is mapped onto a synthetic email address instead. The number is still the
 * thing the operator knows and types; the password is the only thing they
 * must remember.
 *
 * The email/password provider is the one auth method on this project that
 * works with no billing, no OAuth client and no Console setup — see the
 * sign-in screen for the current state of the alternatives.
 */
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

/** Raw list of auth error codes worth showing a user, with Hindi copy. */
export const AUTH_ERRORS = {
  'auth/invalid-verification-code': 'OTP galat hai. Dobara check karein.',
  'auth/code-expired': 'OTP expire ho gaya. Naya OTP bhejein.',
  'auth/too-many-requests': 'Bahut zyada koshish hui. Thodi der baad try karein.',
  'auth/invalid-phone-number': 'Mobile number sahi nahi hai. 10 digit dalein.',
  'auth/unauthorized-domain': 'Is address se login allowed nahi hai. Localhost ya authorised domain use karein.',
  'auth/popup-closed-by-user': 'Google window band ho gayi. Dobara koshish karein.',
  'auth/network-request-failed': 'Network dikkat mein hai. Internet check karein.',
  'auth/operation-not-allowed': 'Ye login method Firebase console mein band hai.'
};

/** Map a Firebase auth error to something an operator can act on. */
export function authErrorMessage(err) {
  if (!err) return 'Kuch galat ho gaya. Dobara koshish karein.';
  const code = typeof err === 'string' ? err : err.code;
  return AUTH_ERRORS[code] || err.message || 'Kuch galat ho gaya. Dobara koshish karein.';
}
