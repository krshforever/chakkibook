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
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Sahi 10-digit mobile number dalein (Enter valid 10-digit phone number)');
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
          address: 'Main Market',
          chakkiRates: { pisai: 4, kadda: { wheat: 1, dana: 1.5, maize: 1 }, kaddaPer: 40 },
          spellarRates: { pirai: 12, khari: 35 },
          smsSettings: { enabled: true, onDropOff: true, onDone: true, onPickedUp: true },
          aiEnabled: false
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
          shopId = `shop_${cleanPhone}`; // Fallback default
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

  return (
    <div className="login-screen" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'var(--bg-main, #0f172a)',
      color: 'var(--text-main, #f8fafc)'
    }}>
      <div className="login-card" style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--card-bg, #1e293b)',
        borderRadius: '1.25rem',
        padding: '2rem 1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        {/* Logo & Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <img 
            src="/logo.png" 
            alt="Chakkibook Logo" 
            style={{ 
              width: '88px', 
              height: '88px', 
              borderRadius: '1rem', 
              margin: '0 auto 1rem auto',
              objectFit: 'cover',
              boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
            }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: '#fbbf24' }}>
            🌾 Chakkibook
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
            Atta Chakki & Oil Mill Smart Register
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#7f1d1d',
            color: '#fca5a5',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            textAlign: 'left'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegistering && (
            <>
              <div>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#cbd5e1' }}>
                  🏪 Shop / Chakki ka Naam
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vanshu Atta Chakki"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#cbd5e1' }}>
                  👤 Aapka Naam (Owner Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bhaiya"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#cbd5e1' }}>
              📱 Mobile Number
            </label>
            <input
              type="tel"
              placeholder="9876543210"
              maxLength="10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                minHeight: '52px',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '700',
                letterSpacing: '0.05em'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem', color: '#cbd5e1' }}>
              🔒 Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                minHeight: '52px',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '52px',
              marginTop: '0.5rem',
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.1rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)'
            }}
          >
            {loading ? 'Kripya rukayein...' : (isRegistering ? '🚀 Account Banayein' : '🔑 SIGN IN')}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #334155', fontSize: '0.9rem' }}>
          {isRegistering ? (
            <span>
              Pehle se account hai?{' '}
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#fbbf24', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                Sign In Karein
              </button>
            </span>
          ) : (
            <span>
              Pehli baar istemaal kar rahe hain?{' '}
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#fbbf24', fontWeight: '700', cursor: 'pointer', padding: 0 }}
              >
                Naya Account Banayein
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
