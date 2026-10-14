import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  Store,
  User,
  ShieldCheck
} from 'lucide-react';
import {
  signInWithGoogle,
  resolveGoogleRedirect,
  authErrorMessage
} from '../firebase/auth';
import { resolveShopForUser, createShopForUser } from '../firebase/shopBootstrap';

/**
 * Sign-in — Google only.
 *
 * Phone OTP was removed: it needs Blaze billing attached to the Firebase
 * project (`auth/billing-not-enabled`), and the billing account on file is
 * closed. Until billing exists, the OTP button can only fail, so it is gone
 * rather than broken. The OTP helpers still live in `firebase/auth.js` —
 * re-adding the UI is a single step block when billing is sorted.
 *
 * Google is the identity most Android phones already have: one tap, no
 * password, no number to type. New users name their shop once via
 * `resolveShopForUser` → `createShopForUser`; returning users pass straight
 * through (`needsShopProfile` in App.jsx keeps Login mounted until then).
 */

export default function Login({ onLoginSuccess }) {
  const [step, setStep] = useState('choose'); // choose | newshop
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [notice, setNotice] = useState('');

  // A redirect-based Google sign-in lands here with no session until we ask.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await resolveGoogleRedirect();
        if (!alive || !user) return;
        await finishLogin(user);
      } catch (err) {
        if (alive) setError(authErrorMessage(err));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fail = (err) => setError(authErrorMessage(err));
  const clearMessages = () => { setError(''); setNotice(''); };

  /** Shared tail: resolve the shop, then hand off. */
  const finishLogin = useCallback(async (user) => {
    try {
      const { shopId, needsShopData } = await resolveShopForUser(user);
      if (needsShopData) {
        setPendingUser(user);
        setOwnerName(user.displayName || '');
        setStep('newshop');
        return;
      }
      onLoginSuccess(user, shopId, 'owner');
    } catch (err) {
      fail(err);
    }
  }, [onLoginSuccess]);

  const handleGoogle = async () => {
    clearMessages();
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (!user) {
        // Redirect in flight — the page is about to navigate away.
        setNotice('Google par le ja rahe hain...');
        return;
      }
      await finishLogin(user);
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e) => {
    e?.preventDefault();
    clearMessages();
    if (!shopName.trim()) {
      setError('Dukaan ka naam likhein.');
      return;
    }
    setLoading(true);
    try {
      const shopId = await createShopForUser(pendingUser, {
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || undefined
      });
      onLoginSuccess(pendingUser, shopId, 'owner');
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cb-auth">
      <div className="cb-auth-card">
        <header className="cb-auth-head">
          <div className="cb-auth-mark">
            <Store size={30} strokeWidth={1.9} />
          </div>
          <h1 className="cb-auth-title">Chakkibook</h1>
          <p className="cb-auth-sub">
            {step === 'choose'
              ? 'Chakki aur tel ki digital register — boliye, kaam ho jaayega'
              : 'Aapki dukaan ka profile'}
          </p>
        </header>

        {error && (
          <div className="cb-auth-alert" role="alert">
            <AlertCircle size={17} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}
        {!error && notice && <div className="cb-auth-note" role="status">{notice}</div>}

        {step === 'choose' && (
          <div className="cb-auth-stack">
            <button type="button" className="cb-auth-google" onClick={handleGoogle} disabled={loading}>
              {loading
                ? <Loader2 size={19} className="cb-auth-spin" />
                : <GoogleGlyph />}
              <span>{loading ? 'Jod rahe hain...' : 'Google se login karein'}</span>
            </button>

            <p className="cb-auth-fineprint">
              Password ki zaroorat nahi — jis Google account se phone chalta hai, wahi kaafi hai.
            </p>
          </div>
        )}

        {/* ---------------- new shop profile ---------------- */}
        {step === 'newshop' && (
          <form className="cb-auth-stack" onSubmit={handleCreateShop}>
            <p className="cb-auth-fineprint" style={{ marginBottom: '0.25rem' }}>
              Pehli baar aa rahe hain — dukaan ka naam bataiye, bas.
            </p>
            <Field
              label="Dukaan / Chakki ka naam"
              icon={<Store size={15} />}
              input={
                <input
                  className="cb-auth-input"
                  type="text"
                  placeholder="e.g. Vanshu Atta Chakki"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  autoFocus
                />
              }
            />
            <Field
              label="Aapka naam"
              icon={<User size={15} />}
              input={
                <input
                  className="cb-auth-input"
                  type="text"
                  placeholder="e.g. Bhaiya"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              }
            />
            <button type="submit" className="cb-auth-submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="cb-auth-spin" /> : <ArrowRight size={18} strokeWidth={2.4} />}
              <span>Shuru karein</span>
            </button>
          </form>
        )}

        <div className="cb-auth-trust">
          <ShieldCheck size={15} strokeWidth={2.2} />
          <span>Aapka data aapke phone mein bhi surakshit rehta hai</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, input }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="cb-field">
      <label className="cb-field-label" style={{ color: focused ? 'hsl(var(--brand-600))' : 'hsl(var(--ink-2))' }}>
        {icon}
        <span>{label}</span>
      </label>
      <div
        className="cb-field-box"
        data-focused={focused}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
      >
        {input}
      </div>
    </div>
  );
}

/** Google's mark. Inline SVG so it needs no extra dependency. */
function GoogleGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
