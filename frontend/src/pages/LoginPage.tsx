import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please re-enter your username and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem("token", response.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err?.response?.data || err.message);

      if (err?.response?.status === 401) {
        setError("Invalid credentials. Please re-enter your username and password again.");
        setPassword(""); // Clear password field for re-entry
      } else if (err?.response?.data?.detail) {
        setError("Error: " + err.response.data.detail);
      } else {
        setError("Login failed. Check backend server connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--bg-color-main)",
      backgroundImage: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 255, 255, 0.05), transparent 25%),
                        radial-gradient(circle at 50% 50%, rgba(10, 10, 15, 1) 0%, rgba(5, 5, 10, 1) 100%)`,
      position: "relative",
      overflow: "hidden",
      fontFamily: "var(--font-body)"
    }}>
      {/* Grid Pattern Background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 0
      }}></div>

      <div style={{
        width: "100%",
        maxWidth: "420px",
        position: "relative",
        zIndex: 10,
        animation: "fadeUp 0.8s ease-out forwards"
      }}>
        {/* Glow behind card */}
        <div style={{
          position: "absolute",
          inset: -2,
          background: "linear-gradient(45deg, var(--accent-cyan), transparent, var(--accent-cyan))",
          borderRadius: "16px",
          filter: "blur(18px)",
          opacity: 0.15,
          zIndex: -1
        }}></div>

        <div style={{
          background: "rgba(15, 15, 23, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 255, 255, 0.15)",
          borderRadius: "16px",
          padding: "40px 36px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        }}>
          
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(0, 255, 255, 0.05)",
              border: "1px solid rgba(0, 255, 255, 0.2)",
              marginBottom: "16px",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h2 style={{
              color: "white",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              marginBottom: "8px",
            }}>
              SOC Log Analyzer
            </h2>
            <p style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
            }}>
              Please sign in to access the dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Username Input */}
            <div style={{ position: "relative" }}>
              <label style={{
                position: "absolute",
                left: focusedInput === "username" || username ? "12px" : "44px",
                top: focusedInput === "username" || username ? "-10px" : "14px",
                fontSize: focusedInput === "username" || username ? "0.75rem" : "0.95rem",
                color: focusedInput === "username" ? "var(--accent-cyan)" : "var(--text-secondary)",
                background: focusedInput === "username" || username ? "var(--bg-color-main)" : "transparent",
                padding: "0 6px",
                transition: "all 0.2s ease",
                pointerEvents: "none",
                fontWeight: 500,
                borderRadius: "4px",
                zIndex: "5"
              }}>Username</label>
              
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedInput === "username" ? "var(--accent-cyan)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "14px", transition: "stroke 0.2s ease" }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 44px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: `1px solid ${focusedInput === "username" ? "var(--accent-cyan)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxShadow: focusedInput === "username" ? "0 0 0 3px rgba(0, 255, 255, 0.1)" : "inset 0 2px 4px rgba(0,0,0,0.2)",
                  }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedInput("username")}
                  onBlur={() => setFocusedInput(null)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ position: "relative" }}>
              <label style={{
                position: "absolute",
                left: focusedInput === "password" || password ? "12px" : "44px",
                top: focusedInput === "password" || password ? "-10px" : "14px",
                fontSize: focusedInput === "password" || password ? "0.75rem" : "0.95rem",
                color: focusedInput === "password" ? "var(--accent-cyan)" : "var(--text-secondary)",
                background: focusedInput === "password" || password ? "var(--bg-color-main)" : "transparent",
                padding: "0 6px",
                transition: "all 0.2s ease",
                pointerEvents: "none",
                fontWeight: 500,
                borderRadius: "4px",
                zIndex: "5"
              }}>Password</label>
              
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focusedInput === "password" ? "var(--accent-cyan)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "14px", transition: "stroke 0.2s ease" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type="password"
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 44px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: `1px solid ${focusedInput === "password" ? "var(--accent-cyan)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxShadow: focusedInput === "password" ? "0 0 0 3px rgba(0, 255, 255, 0.1)" : "inset 0 2px 4px rgba(0,0,0,0.2)",
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: "var(--accent-red-dim)",
                border: "1px solid rgba(255, 51, 102, 0.4)",
                padding: "12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                animation: "shake 0.4s ease-in-out"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p style={{ color: "var(--accent-red)", fontSize: "0.85rem", margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: loading ? "rgba(0, 255, 255, 0.1)" : "var(--accent-cyan)",
                color: loading ? "var(--accent-cyan)" : "#000",
                border: loading ? "1px solid var(--accent-cyan)" : "none",
                fontWeight: 600,
                fontSize: "1rem",
                padding: "12px",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                marginTop: "4px",
                boxShadow: loading ? "none" : "0 0 15px rgba(0, 255, 255, 0.3)",
              }}
            >
              {loading ? (
                <>
                  <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Registration Footer */}
          <div style={{ marginTop: "24px", paddingTop: "20px", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 8px 0" }}>
              Don't have a login?
            </p>
            <Link to="/register" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.95rem",
              color: "var(--accent-cyan)",
              textDecoration: "none",
              fontWeight: 500,
              padding: "8px 16px",
              border: "1px solid rgba(0, 255, 255, 0.3)",
              borderRadius: "6px",
              background: "rgba(0, 255, 255, 0.05)",
              transition: "all 0.2s"
            }} onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 255, 0.1)";
            }} onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(0, 255, 255, 0.05)";
            }}>
              Register for an Account
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5) !important;
        }
      `}</style>
    </div>
  );
}