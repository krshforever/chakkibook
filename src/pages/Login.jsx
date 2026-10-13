import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Phone,
  Store,
  User,
  KeyRound,
  ShieldCheck,
  MessageSquareLock,
  Smartphone
} from 'lucide-react';
import {
  signInWithGoogle,
  resolveGoogleRedirect,
  attachRecaptcha,
  sendOtp,
  confirmOtp,
  authErrorMessage
} from '../firebase/auth';
import { resolveShopForUser, createShopForUser } from '../firebase/shopBootstrap';
import { useTranslation } from '../utils/translations';

/**
 * Sign-in.
 *
 * Two first-class paths, no password anywhere:
 *
 *   Google  — one tap, the identity most Android phones already have.
 *   Phone   — OTP, no memory required beyond the number itself.
 *
 * The old screen demanded a password before anything else, which for the
 * intended user (a mill operator who may not read) made the rest of the app
 * unreachable. Both paths converge on `resolveShopForUser`, so a returning
 * user goes straight through and a new one is asked only for a shop name.
 *
 * `step` is an explicit state machine rather than derived flags so that a
 * failed OTP can drop back to the number step with the number already filled.
 */

const PHONE_RE = /^[6-9]\d{9}$/;

export default function Login({ onLoginSuccess }) {
  const { t } = useTranslation();

  const [step, setStep] = useState('choose'); // choose | phone | otp | newshop
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [notice, setNotice] = useState('');

  // The confirmation result holds the verification id; it is not stable across
  // a re-render, so it lives in a ref rather than state.
  const confirmationRef = useRef(null);
  const recaptchaRef = useRef(null);
  const recaptchaWidgetId = useRef(null);

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
  }, []);

  // Tear the reCAPTCHA down on unmount; leaving it mounted leaks the widget
  // into the next mount of this screen.
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch (_) { /* already gone */ }
        recaptchaRef.current = null;
      }
    };
  }, []);

  const fail = (err) => setError(authErrorMessage(err));
  const clearMessages = () => { setError(''); setNotice(''); };

  /** Shared tail for both providers: resolve the shop, then hand off. */
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

  const ensureRecaptcha = () => {
    if (recaptchaRef.current) return recaptchaRef.current;
    const verifier = attachRecaptcha('recaptcha-container');
    recaptchaRef.current = verifier;
    recaptchaWidgetId.current = verifier.widgetId;
    return verifier;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    clearMessages();
    if (!PHONE_RE.test(phone)) {
      setError('10 digit ka sahi mobile number dalein.');
      return;
    }
    setLoading(true);
    try {
      const verifier = ensureRecaptcha();
      const confirmation = await sendOtp(phone, verifier);
      confirmationRef.current = confirmation;
      setStep('otp');
      setNotice(`${phone} par OTP bhej diya.`);
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    clearMessages();
    if (otp.trim().length < 6) {
      setError('6 digit ka OTP dalein.');
      return;
    }
    setLoading(true);
    try {
      const user = await confirmOtp(confirmationRef.current, otp);
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

  const goBack = () => {
    clearMessages();
    setStep((s) => (s === 'otp' ? 'phone' : 'choose'));
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
            {step === 'choose' && 'Chakki aur tel ki digital register — boliye, kaam ho jaayega'}
            {step === 'phone' && 'Apna mobile number dalein'}
            {step === 'otp' && 'OTP dalein'}
            {step === 'newshop' && 'Aapki dukaan ka profile'}
          </p>
        </header>

        {error && (
          <div className="cb-auth-alert" role="alert">
            <AlertCircle size={17} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}
        {!error && notice && <div className="cb-auth-note" role="status">{notice}</div>}

        {/* ---------------- choose provider ---------------- */}
        {step === 'choose' && (
          <div className="cb-auth-stack">
            <button type="button" className="cb-auth-google" onClick={handleGoogle} disabled={loading}>
              <GoogleGlyph />
              <span>Google se login karein</span>
            </button>

            <div className="cb-auth-or"><span>ya</span></div>

            <button
              type="button"
              className="cb-auth-phone"
              onClick={() => { clearMessages(); setStep('phone'); }}
              disabled={loading}
            >
              <Smartphone size={20} strokeWidth={2.2} />
              <span>Mobile number se OTP</span>
            </button>

            <p className="cb-auth-fineprint">
              Password ki zaroorat nahi. OTP aane mein 30 second lag sakte hain.
            </p>
          </div>
        )}

        {/* ---------------- phone number ---------------- */}
        {step === 'phone' && (
          <form className="cb-auth-stack" onSubmit={handleSendOtp}>
            <Field
              label="Mobile number"
              icon={<Phone size={15} />}
              input={
                <div className="cb-phone-input">
                  <span className="cb-phone-prefix">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </div>
              }
            />
            <button type="submit" className="cb-auth-submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="cb-auth-spin" /> : <KeyRound size={18} strokeWidth={2.2} />}
              <span>OTP bhejein</span>
            </button>
            <BackLink onClick={goBack} />
          </form>
        )}

        {/* ---------------- otp ---------------- */}
        {step === 'otp' && (
          <form className="cb-auth-stack" onSubmit={handleVerifyOtp}>
            <Field
              label={`+91 ${phone} par aaya 6-digit OTP`}
              icon={<MessageSquareLock size={15} />}
              input={
                <input
                  className="cb-auth-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              }
            />
            <button type="submit" className="cb-auth-submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="cb-auth-spin" /> : <ArrowRight size={18} strokeWidth={2.4} />}
              <span>Verify karein</span>
            </button>
            <button
              type="button"
              className="cb-auth-link"
              onClick={() => { clearMessages(); setStep('phone'); }}
            >
              Number badalna hai?
            </button>
          </form>
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

        {/* Mount point for the invisible reCAPTCHA. Must always be in the DOM
            so the verifier can be attached before the first OTP request. */}
        <div id="recaptcha-container" />

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

function BackLink({ onClick }) {
  return (
    <button type="button" className="cb-auth-link" onClick={onClick}>
      <ArrowLeft size={15} /> Wapas
    </button>
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
