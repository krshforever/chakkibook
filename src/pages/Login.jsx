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
        try {
          await createShopDoc(shopId, {
            id: shopId,
            name: shopName.trim(),
            ownerName: ownerName.trim(),
            ownerPhone: cleanPhone,
            ownerId: user.uid || `user_${cleanPhone}`,
            address: 'Main Market Road',
            chakkiRates: { pisai: 4, kadda: { wheat: 1, dana: 1.5, maize: 1 }, kaddaPer: 40 },
            spellarRates: { pirai: 12, khari: 35 },
            smsSettings: { enabled: true, onDropOff: true, onDone: true, onPickedUp: true },
            aiEnabled: true
          });

          await addMemberToFirestore(shopId, {
            uid: user.uid || `user_${cleanPhone}`,
            phone: cleanPhone,
            name: ownerName.trim(),
            role: 'owner'
          });
        } catch (dbErr) {
          console.warn('Firestore optional sync notice:', dbErr);
        }

        if (onLoginSuccess) onLoginSuccess(user, shopId, 'owner');
      } else {
        // Login
        const user = await loginUser(cleanPhone, password);
        
        let shopId = null;
        try {
          shopId = await findShopByPhone(cleanPhone);
        } catch (e) {
          shopId = `shop_${cleanPhone}`;
        }
        if (!shopId) shopId = `shop_${cleanPhone}`;

        if (onLoginSuccess) onLoginSuccess(user, shopId, 'owner');
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Mobile number ya password galat hai. (New user? Toggle Naya Account!)');
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
    setError('');

    const demoUser = {
      uid: 'user_9876543210',
      email: '9876543210@chakkibook.local',
      isFallback: true
    };

    try {
      await loginUser('9876543210', '123456');
    } catch (e) {
      // Ignore auth provider exceptions for demo mode
    }

    if (onLoginSuccess) {
      onLoginSuccess(demoUser, 'shop_default_1', 'owner');
    }
    setLoading(false);
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
        padding: '2rem 1rem',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 40%, #f1f5f9 100%)',
        color: '#0f172a',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Light Premium Auth Container Card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '1.5rem',
          padding: '2.25rem 1.75rem',
          boxShadow: '0 20px 40px -10px rgba(217, 119, 6, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* App Branding & Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img 
            src="/logo.png" 
            alt="Chakkibook Logo" 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '1.25rem', 
              objectFit: 'cover',
              margin: '0 auto 0.75rem auto',
              boxShadow: '0 8px 20px rgba(217, 119, 6, 0.25)',
              border: '2px solid #fef3c7'
            }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '800', 
            margin: '0 0 0.25rem 0', 
            color: '#b45309',
            letterSpacing: '-0.02em'
          }}>
            Chakkibook 🌾
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
            Atta Chakki & Oil Mill Smart Register
          </p>
        </div>

        {/* Mode Switcher Pills (Sign In / Naya Account) */}
        <div 
          style={{
            display: 'flex',
            background: '#f8fafc',
            padding: '4px',
            borderRadius: '1rem',
            marginBottom: '1.25rem',
            border: '1px solid #e2e8f0'
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
              background: !isRegistering ? '#d97706' : 'transparent',
              color: !isRegistering ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
              background: isRegistering ? '#d97706' : 'transparent',
              color: isRegistering ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isRegistering ? '0 4px 12px rgba(217, 119, 6, 0.3)' : 'none'
            }}
          >
            🚀 Naya Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegistering && (
            <>
              <div>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
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
                    minHeight: '48px',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
                  👤 Aapka Naam (Owner Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bhaiya / Krish"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
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
                minHeight: '48px',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: '1.05rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#334155' }}>
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
                minHeight: '48px',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: '0.95rem',
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
              minHeight: '50px',
              marginTop: '0.4rem',
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 16px rgba(217, 119, 6, 0.35)'
            }}
          >
            {loading ? 'Kripya rukayein...' : (isRegistering ? '🚀 Account Banayein' : '🔑 SIGN IN')}
          </button>
        </form>

        {/* 1-Tap Quick Demo Login */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              borderRadius: '0.75rem',
              padding: '10px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            ⚡ Quick 1-Tap Demo Login (No Setup Needed)
          </button>
        </div>

        {/* Watermark Credit */}
        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '0.85rem', 
          borderTop: '1px solid #f1f5f9', 
          textAlign: 'center' 
        }}>
          <span style={{ 
            fontSize: '0.78rem', 
            color: '#64748b', 
            fontWeight: 600
          }}>
            Made with ❤️ by <strong style={{ color: '#d97706' }}>Krish Tiwari & Team</strong>
          </span>
        </div>
      </div>

      {/* Footer Branding */}
      <footer style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
          Chakkibook V4.5-AI Supreme • Enterprise Flour & Oil Mill Register
        </span>
      </footer>
    </div>
  );
}
