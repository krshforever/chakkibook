import React, { useState } from "react";
import { 
  Key, 
  UserPlus, 
  Phone, 
  Lock, 
  Store, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2
} from "lucide-react";
import { loginUser, registerUser } from "../firebase/auth";
import { createShopDoc, addMemberToFirestore, findShopByPhone } from "../firebase/firestore";

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Sahi 10-digit mobile number dalein (e.g. 9876543210)");
      return;
    }

    if (password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        if (!shopName.trim() || !ownerName.trim()) {
          setError("Shop ka naam aur aapse aapka naam zaroori hai");
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
            address: "Main Market Road",
            chakkiRates: { pisai: 4, kadda: { wheat: 1, dana: 1.5, maize: 1 }, kaddaPer: 40 },
            spellarRates: { pirai: 12, khari: 35 },
            smsSettings: { enabled: true, onDropOff: true, onDone: true, onPickedUp: true },
            aiEnabled: true
          });

          await addMemberToFirestore(shopId, {
            uid: user.uid || `user_${cleanPhone}`,
            phone: cleanPhone,
            name: ownerName.trim(),
            role: "owner"
          });
        } catch (dbErr) {
          console.warn("Firestore optional sync notice:", dbErr);
        }

        if (onLoginSuccess) onLoginSuccess(user, shopId, "owner");
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

        if (onLoginSuccess) onLoginSuccess(user, shopId, "owner");
      }
    } catch (err) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Mobile number ya password galat hai. (New user? Toggle Naya Account!)");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Yeh mobile number pehle se registered hai. Sign In karein!");
      } else {
        setError(err.message || "Login karne mein dikkat aayi. Kripya firse try karein.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setPhone("9876543210");
    setPassword("123456");
    setLoading(true);
    setError("");

    const demoUser = {
      uid: "user_9876543210",
      email: "9876543210@chakkibook.local",
      isFallback: true
    };

    try {
      await loginUser("9876543210", "123456");
    } catch (e) {
      // Ignore auth provider exceptions for demo mode
    }

    if (onLoginSuccess) {
      onLoginSuccess(demoUser, "shop_default_1", "owner");
    }
    setLoading(false);
  };

  return (
    <div 
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 1rem",
        background: "radial-gradient(ellipse at 50% 0%, rgba(251, 191, 36, 0.18), rgba(254, 243, 199, 0.35) 40%, #f8fafc 90%)",
        color: "#0f172a",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        boxSizing: "border-box"
      }}
    >
      <style>{`
        @keyframes cb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .cb-spinner {
          animation: cb-spin 0.75s linear infinite;
        }
        .cb-submit-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cb-submit-btn:hover:not(:disabled) {
          filter: brightness(1.06);
          box-shadow: 0 10px 24px -4px rgba(217, 119, 6, 0.45) !important;
          transform: translateY(-1px);
        }
        .cb-submit-btn:active:not(:disabled) {
          transform: translateY(0px) scale(0.985);
        }
        .cb-demo-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cb-demo-btn:hover:not(:disabled) {
          background-color: #fef3c7 !important;
          border-color: #f59e0b !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.18) !important;
        }
        .cb-demo-btn:active:not(:disabled) {
          transform: translateY(0px) scale(0.985);
        }
        .cb-tab-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cb-tab-btn:hover {
          color: #0f172a;
        }
      `}</style>

      {/* Light Premium Auth Container Card */}
      <div 
        style={{
          width: "100%",
          maxWidth: "430px",
          backgroundColor: "#ffffff",
          borderRadius: "1.5rem",
          padding: "2.25rem 1.75rem",
          boxShadow: "0 25px 50px -12px rgba(217, 119, 6, 0.14), 0 0 0 1px rgba(226, 232, 240, 0.8), 0 2px 4px rgba(0, 0, 0, 0.02)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          position: "relative"
        }}
      >
        {/* App Branding & Logo Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          {/* Logo / Brand Icon Badge */}
          <div style={{ display: "inline-flex", position: "relative", marginBottom: "0.85rem" }}>
            <img 
              src="/logo.png" 
              alt="Chakkibook Logo" 
              style={{ 
                width: "76px", 
                height: "76px", 
                borderRadius: "1.25rem", 
                objectFit: "cover",
                boxShadow: "0 10px 25px -4px rgba(217, 119, 6, 0.3)",
                border: "2.5px solid #fef3c7",
                display: "block"
              }} 
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>

          {/* Micro-badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.4rem" }}>
            <span style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "5px", 
              padding: "3px 10px", 
              background: "#fef3c7", 
              border: "1px solid #fde68a", 
              borderRadius: "9999px", 
              fontSize: "0.7rem", 
              fontWeight: 700, 
              color: "#b45309",
              letterSpacing: "0.04em",
              textTransform: "uppercase"
            }}>
              <Sparkles size={12} strokeWidth={2.5} style={{ color: "#d97706" }} />
              Enterprise Register
            </span>
          </div>

          <h1 style={{ 
            fontSize: "1.75rem", 
            fontWeight: 800, 
            margin: "0 0 0.3rem 0", 
            color: "#0f172a",
            letterSpacing: "-0.03em",
            fontFamily: "'Outfit', system-ui, sans-serif"
          }}>
            Chakkibook
          </h1>
          <p style={{ fontSize: "0.86rem", color: "#64748b", margin: 0, fontWeight: 500 }}>
            Atta Chakki & Oil Mill Smart Digital Register
          </p>
        </div>

        {/* Segmented Tab Switcher (Sign In / Naya Account) */}
        <div 
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "0.85rem",
            marginBottom: "1.5rem",
            border: "1px solid #e2e8f0",
            gap: "4px"
          }}
        >
          <button
            type="button"
            className="cb-tab-btn"
            onClick={() => { setIsRegistering(false); setError(""); }}
            style={{
              padding: "10px 14px",
              borderRadius: "0.65rem",
              border: !isRegistering ? "1px solid rgba(226, 232, 240, 0.8)" : "1px solid transparent",
              background: !isRegistering ? "#ffffff" : "transparent",
              color: !isRegistering ? "#0f172a" : "#64748b",
              fontWeight: !isRegistering ? 700 : 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              boxShadow: !isRegistering ? "0 2px 6px rgba(0, 0, 0, 0.06)" : "none"
            }}
          >
            <Key size={16} strokeWidth={2.2} style={{ color: !isRegistering ? "#d97706" : "#94a3b8" }} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className="cb-tab-btn"
            onClick={() => { setIsRegistering(true); setError(""); }}
            style={{
              padding: "10px 14px",
              borderRadius: "0.65rem",
              border: isRegistering ? "1px solid rgba(226, 232, 240, 0.8)" : "1px solid transparent",
              background: isRegistering ? "#ffffff" : "transparent",
              color: isRegistering ? "#0f172a" : "#64748b",
              fontWeight: isRegistering ? 700 : 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              boxShadow: isRegistering ? "0 2px 6px rgba(0, 0, 0, 0.06)" : "none"
            }}
          >
            <UserPlus size={16} strokeWidth={2.2} style={{ color: isRegistering ? "#d97706" : "#94a3b8" }} />
            <span>Naya Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            fontSize: "0.85rem",
            marginBottom: "1.25rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            lineHeight: 1.45
          }}>
            <AlertCircle size={17} strokeWidth={2} style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
          {isRegistering && (
            <>
              <div>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  fontSize: "0.8rem", 
                  fontWeight: 600, 
                  marginBottom: "0.4rem", 
                  color: "#334155" 
                }}>
                  <Store size={14} style={{ color: focusedField === "shopName" ? "#d97706" : "#64748b" }} />
                  <span>Shop / Chakki Ka Naam</span>
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  border: focusedField === "shopName" ? "1.5px solid #d97706" : "1.5px solid #cbd5e1",
                  borderRadius: "0.75rem",
                  boxShadow: focusedField === "shopName" ? "0 0 0 3.5px rgba(217, 119, 6, 0.16)" : "0 1px 2px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.15s ease",
                  overflow: "hidden"
                }}>
                  <input
                    type="text"
                    placeholder="e.g. Vanshu Atta Chakki & Oil Mill"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    onFocus={() => setFocusedField("shopName")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={{
                      width: "100%",
                      minHeight: "48px",
                      padding: "0.75rem 1rem",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#0f172a",
                      fontSize: "0.94rem",
                      fontWeight: 500,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  fontSize: "0.8rem", 
                  fontWeight: 600, 
                  marginBottom: "0.4rem", 
                  color: "#334155" 
                }}>
                  <User size={14} style={{ color: focusedField === "ownerName" ? "#d97706" : "#64748b" }} />
                  <span>Aapka Naam (Owner Name)</span>
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  border: focusedField === "ownerName" ? "1.5px solid #d97706" : "1.5px solid #cbd5e1",
                  borderRadius: "0.75rem",
                  boxShadow: focusedField === "ownerName" ? "0 0 0 3.5px rgba(217, 119, 6, 0.16)" : "0 1px 2px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.15s ease",
                  overflow: "hidden"
                }}>
                  <input
                    type="text"
                    placeholder="e.g. Bhaiya / Krish"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    onFocus={() => setFocusedField("ownerName")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={{
                      width: "100%",
                      minHeight: "48px",
                      padding: "0.75rem 1rem",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#0f172a",
                      fontSize: "0.94rem",
                      fontWeight: 500,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              fontSize: "0.8rem", 
              fontWeight: 600, 
              marginBottom: "0.4rem", 
              color: "#334155" 
            }}>
              <Phone size={14} style={{ color: focusedField === "phone" ? "#d97706" : "#64748b" }} />
              <span>Mobile Number (10 Digits)</span>
            </label>
            <div style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ffffff",
              border: focusedField === "phone" ? "1.5px solid #d97706" : "1.5px solid #cbd5e1",
              borderRadius: "0.75rem",
              boxShadow: focusedField === "phone" ? "0 0 0 3.5px rgba(217, 119, 6, 0.16)" : "0 1px 2px rgba(0, 0, 0, 0.03)",
              transition: "all 0.15s ease",
              overflow: "hidden"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "0 10px 0 14px",
                color: "#64748b",
                fontSize: "0.92rem",
                fontWeight: 700,
                borderRight: "1px solid #e2e8f0",
                userSelect: "none",
                backgroundColor: "#f8fafc",
                minHeight: "48px"
              }}>
                <span>+91</span>
              </div>
              <input
                type="tel"
                placeholder="9876543210"
                maxLength="10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                required
                style={{
                  width: "100%",
                  minHeight: "48px",
                  padding: "0.75rem 1rem",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#0f172a",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              fontSize: "0.8rem", 
              fontWeight: 600, 
              marginBottom: "0.4rem", 
              color: "#334155" 
            }}>
              <Lock size={14} style={{ color: focusedField === "password" ? "#d97706" : "#64748b" }} />
              <span>Secret Password</span>
            </label>
            <div style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#ffffff",
              border: focusedField === "password" ? "1.5px solid #d97706" : "1.5px solid #cbd5e1",
              borderRadius: "0.75rem",
              boxShadow: focusedField === "password" ? "0 0 0 3.5px rgba(217, 119, 6, 0.16)" : "0 1px 2px rgba(0, 0, 0, 0.03)",
              transition: "all 0.15s ease",
              overflow: "hidden"
            }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
                style={{
                  width: "100%",
                  minHeight: "48px",
                  padding: "0.75rem 1rem",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#0f172a",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0 14px",
                  height: "48px",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="cb-submit-btn"
            style={{
              width: "100%",
              minHeight: "50px",
              marginTop: "0.35rem",
              background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              boxShadow: "0 6px 18px rgba(217, 119, 6, 0.35)",
              opacity: loading ? 0.75 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} strokeWidth={2.5} className="cb-spinner" />
                <span>Kripya rukayein...</span>
              </>
            ) : isRegistering ? (
              <>
                <UserPlus size={18} strokeWidth={2.2} />
                <span>Account Banayein</span>
                <ArrowRight size={16} strokeWidth={2.2} />
              </>
            ) : (
              <>
                <Key size={18} strokeWidth={2.2} />
                <span>SIGN IN</span>
                <ArrowRight size={16} strokeWidth={2.2} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "1.4rem 0 1rem 0"
        }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
          <span style={{ 
            fontSize: "0.72rem", 
            fontWeight: 700, 
            color: "#94a3b8", 
            letterSpacing: "0.06em",
            textTransform: "uppercase"
          }}>
            Instant Test Access
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
        </div>

        {/* 1-Tap Quick Demo Login Button */}
        <div>
          <button
            type="button"
            className="cb-demo-btn"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            style={{
              width: "100%",
              minHeight: "46px",
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              color: "#92400e",
              borderRadius: "0.75rem",
              padding: "10px 16px",
              fontSize: "0.86rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 1px 3px rgba(245, 158, 11, 0.08)"
            }}
          >
            <Zap size={16} strokeWidth={2.5} style={{ color: "#d97706", fill: "#d97706" }} />
            <span>Quick 1-Tap Demo Login (No Setup Needed)</span>
          </button>
        </div>

        {/* Trust & Security Guarantee Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          marginTop: "1.1rem",
          fontSize: "0.74rem",
          color: "#64748b",
          fontWeight: 500
        }}>
          <ShieldCheck size={15} strokeWidth={2.2} style={{ color: "#059669" }} />
          <span>Cloud Sync & 256-bit Encrypted Ledger</span>
        </div>

        {/* Watermark Credit */}
        <div style={{ 
          marginTop: "1.35rem", 
          paddingTop: "0.95rem", 
          borderTop: "1px solid #f1f5f9", 
          textAlign: "center" 
        }}>
          <span style={{ 
            fontSize: "0.78rem", 
            color: "#64748b", 
            fontWeight: 500,
            letterSpacing: "0.01em"
          }}>
            Made with ❤️ by <strong style={{ color: "#b45309", fontWeight: 700 }}>Krish Tiwari & Team</strong>
          </span>
        </div>
      </div>

      {/* Footer Branding */}
      <footer style={{ marginTop: "1.25rem", textAlign: "center" }}>
        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500, letterSpacing: "0.01em" }}>
          Chakkibook V4.5-AI Supreme • Enterprise Flour & Oil Mill Register
        </span>
      </footer>
    </div>
  );
}
