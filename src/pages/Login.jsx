import React, { useState } from 'react';
import { loginUser, registerUser } from '../firebase/auth';
import { createShopDoc, addMemberToFirestore, findShopByPhone } from '../firebase/firestore';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Sahi 10-digit mobile number dalein (e.g. 9876543210)');
      return;
    }

    if (password.length < 6) {
      setError('Password kam se kam 6 characters ka hona chahiye');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        if (!shopName.trim() || !ownerName.trim()) {
          setError('Shop ka naam aur aapse aapka naam zaroori hai');
          setLoading(false);
          return;
        }

        // Register in Firebase Auth
        const user = await registerUser(cleanPhone, password);
        const shopId = `shop_${cleanPhone}`;

        // Create Shop Document in Firestore
        await createShopDoc(shopId, {
          id: shopId,
          name: shopName.trim(),
          ownerName: ownerName.trim(),
          ownerPhone: cleanPhone,
          ownerId: user.uid,
          address: 'Main Market Road',
          chakkiRates: { pisai: 4, kadda: { wheat: 1, dana: 1.5, maize: 1 }, kaddaPer: 40 },
          spellarRates: { pirai: 12, khari: 35 },
          smsSettings: { enabled: true, onDropOff: true, onDone: true, onPickedUp: true },
          aiEnabled: true
        });

        // Add owner to members collection
        await addMemberToFirestore(shopId, {
          uid: user.uid,
          phone: cleanPhone,
          name: ownerName.trim(),
          role: 'owner'
        });

        if (onLoginSuccess) onLoginSuccess(user, shopId, 'owner');
      } else {
        // Login
        const user = await loginUser(cleanPhone, password);
        
        // Find user shopId
        let shopId = await findShopByPhone(cleanPhone);
        if (!shopId) {
          shopId = `shop_${cleanPhone}`;
        }

        if (onLoginSuccess) onLoginSuccess(user, shopId, 'owner');
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Mobile number ya password galat hai');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Yeh mobile number pehle se registered hai. Sign In karein!');
      } else {
        setError(err.message || 'Login karne mein dikkat aayi. Kripya firse try karein.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setPhone('9876543210');
    setPassword('123456');
    setLoading(true);
    try {
      const user = await loginUser('9876543210', '123456');
      if (onLoginSuccess) onLoginSuccess(user, 'shop_default_1', 'owner');
    } catch (e) {
      if (onLoginSuccess) onLoginSuccess({ uid: 'demo_owner', email: '9876543210@chakkibook.local' }, 'shop_default_1', 'owner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        background: 'radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.18) 0%, transparent 60%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Glow Elements */}
      <div 
        style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          height: '320px',
          background: 'rgba(245, 158, 11, 0.12)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />

      {/* Main Glassmorphic Auth Card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '1.5rem',
          padding: '2.25rem 1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1
        }}
      >
        {/* App Branding & Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
            <img 
              src="/logo.png" 
              alt="Chakkibook Logo" 
              style={{ 
                width: '84px', 
                height: '84px', 
                borderRadius: '1.25rem', 
                objectFit: 'cover',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.35)',
                border: '2px solid rgba(245, 158, 11, 0.4)'
              }} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <h1 style={{ 
            fontSize: '1.85rem', 
            fontWeight: '800', 
            margin: '0 0 0.35rem 0', 
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Chakkibook 🌾
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
            Atta Chakki & Oil Mill Smart Register
          </p>
        </div>

        {/* Auth Mode Toggle Pill */}
        <div 
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '4px',
            borderRadius: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '0.75rem',
              border: 'none',
              background: !isRegistering ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
              color: !isRegistering ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
              boxShadow: !isRegistering ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
            }}
          >
            🔑 Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '0.75rem',
              border: 'none',
              background: isRegistering ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
              color: isRegistering ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
              boxShadow: isRegistering ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
            }}
          >
            🚀 Naya Account
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '0.85rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {isRegistering && (
            <>
              <div>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  🏪 Shop / Chakki Ka Naam
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vanshu Atta Chakki & Oil Mill"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  👤 Aapka Naam (Owner / Manager)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bhaiya / Krish"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
              📱 Mobile Number (10 Digits)
            </label>
            <input
              type="tel"
              placeholder="9876543210"
              maxLength="10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{
                width: '100%',
                minHeight: '52px',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
              🔒 Secret Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                minHeight: '52px',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '54px',
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
              transition: 'transform 0.2s ease'
            }}
          >
            {loading ? 'Kripya rukayein...' : (isRegistering ? '🚀 Account Banayein & Start' : '🔑 SIGN IN')}
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              borderRadius: '0.75rem',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            ⚡ Quick 1-Tap Demo Login (No Setup Needed)
          </button>
        </div>

        {/* Watermark & Team Credit */}
        <div style={{ 
          marginTop: '1.75rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
          textAlign: 'center' 
        }}>
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#64748b', 
            fontWeight: 600,
            letterSpacing: '0.03em'
          }}>
            Made with ❤️ by <strong style={{ color: '#94a3b8' }}>Krish Tiwari & Team</strong>
          </span>
        </div>
      </div>

      {/* Footer Sub-Watermark */}
      <footer style={{ marginTop: '1.5rem', textAlign: 'center', zIndex: 1 }}>
        <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 500 }}>
          Chakkibook V4.5-AI Supreme • Enterprise Flour & Oil Mill Management
        </span>
      </footer>
    </div>
  );
}
