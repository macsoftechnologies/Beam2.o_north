import { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../../services/authService";
import { showSuccess, showError } from "../../../components/common/Toast/Toast";
import { navigateTo } from "../../../config/basePath";
import { isTokenValid } from "../../../components/common/PublicRoute";
import "./ForgotPassword.css";

const OTP_LENGTH = 6;

export default function ForgotPassword() {
  // Redirect if already logged in
  if (isTokenValid()) {
    return <Navigate to="/dashboard" replace />;
  }

  // ── Step: 1 = enter username, 2 = enter OTP + new password ──
  const [step, setStep] = useState(1);

  // Step 1 state
  const [username, setUsername] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [errorStep1, setErrorStep1] = useState("");

  // Step 2 state — OTP
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  // Step 2 state — new password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [errorStep2, setErrorStep2] = useState("");

  // Returned from step 1
  const [userId, setUserId] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState("");

  // Auto-focus first OTP input when step 2 mounts
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── OTP input handlers ───────────────────────────
  const handleDigitChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setErrorStep2("");
    if (val && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ""; setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  // ── Step 1: Send OTP ─────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorStep1("");

    if (!username.trim()) {
      setErrorStep1("Please enter your username.");
      return;
    }

    setLoadingSend(true);
    try {
      const res = await forgotPassword({ username: username.trim() });
      if (res && (res.statusCode === 200 || res.status === true)) {
        setUserId(res.user_id);
        setMaskedPhone(res.maskedPhone || "");
        showSuccess(res.message || "OTP sent successfully.");
        setStep(2);
      } else {
        const msg = res?.message || "Something went wrong. Please try again.";
        setErrorStep1(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP.";
      setErrorStep1(msg);
      showError(msg);
    } finally {
      setLoadingSend(false);
    }
  };

  // ── Step 2: Reset Password ────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorStep2("");

    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setErrorStep2("Please enter the full 6-digit OTP.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorStep2("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorStep2("Passwords do not match.");
      return;
    }

    setLoadingReset(true);
    try {
      const res = await resetPassword({
        user_id: userId,
        otp,
        password: newPassword,
      });

      if (res && (res.statusCode === 200 || res.status === true)) {
        showSuccess(res.message || "Password reset successfully!");
        setTimeout(() => navigateTo("/login", true), 1800);
      } else {
        const msg = res?.message || "Failed to reset password.";
        setErrorStep2(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "An error occurred.";
      setErrorStep2(msg);
      showError(msg);
    } finally {
      setLoadingReset(false);
    }
  };

  const filled = digits.filter(Boolean).length;

  return (
    <div className="fp-root">
      {/* Animated Background */}
      <div className="bg-scene">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      <main>
        <div className="fp-card">

          {/* Back button */}
          <button className="back-btn" onClick={() => navigateTo("/login")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to login
          </button>

          {/* Icon */}
          <div className="shield-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              {step === 2 ? (
                <path d="M9 12l2 2 4-4" />
              ) : (
                <path d="M12 8v4M12 16h.01" />
              )}
            </svg>
          </div>

          {/* Brand badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div className="brand-badge">
              <span className="dot" />
              {step === 1 ? "Password Recovery" : "Verification"}
            </div>
          </div>

          {/* Heading */}
          <h1 className="fp-heading">
            {step === 1 ? (
              <>Reset <span>Password</span></>
            ) : (
              <>Verify <span>& Reset</span></>
            )}
          </h1>

          <p className="fp-subtext">
            {step === 1
              ? "Enter your username and we'll send a verification code to your registered phone number."
              : `Enter the 6-digit code sent to your phone${maskedPhone ? ` ending in ${maskedPhone}` : ""} and set your new password.`
            }
          </p>

          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? "active" : ""}`} />
            <div className={`step-dot ${step >= 2 ? "active" : ""}`} />
          </div>

          {/* ── STEP 1: Username form ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} noValidate>
              {errorStep1 && (
                <div className="fp-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorStep1}</span>
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="fp-username">Username</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="fp-username"
                    type="text"
                    className="form-input"
                    placeholder="Enter your username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="fp-btn"
                id="fpSendOtpBtn"
                disabled={loadingSend}
              >
                {loadingSend ? (
                  <div className="btn-loader" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP + New Password form ── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} noValidate>
              {errorStep2 && (
                <div className="fp-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorStep2}</span>
                </div>
              )}

              {/* OTP section */}
              <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(226,232,240,0.5)" }}>
                Verification Code
              </div>

              {/* Progress bar */}
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(filled / OTP_LENGTH) * 100}%` }} />
              </div>
              <div className="progress-label">{filled} of {OTP_LENGTH} digits entered</div>

              {/* OTP inputs */}
              <div className="otp-wrapper" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-field${d ? " filled" : ""}`}
                    value={d}
                    onChange={e => handleDigitChange(e, i)}
                    onKeyDown={e => handleDigitKeyDown(e, i)}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {/* New password */}
              <div className="field-group">
                <label className="field-label" htmlFor="fp-new-pass">New Password</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    id="fp-new-pass"
                    type={showNewPass ? "text" : "password"}
                    className="form-input"
                    placeholder="New password (min 6 chars)"
                    style={{ paddingRight: 46 }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="toggle-pass" onClick={() => setShowNewPass(!showNewPass)} aria-label="Toggle new password">
                    {showNewPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="field-group">
                <label className="field-label" htmlFor="fp-confirm-pass">Confirm Password</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    id="fp-confirm-pass"
                    type={showConfirmPass ? "text" : "password"}
                    className="form-input"
                    placeholder="Confirm new password"
                    style={{ paddingRight: 46 }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="toggle-pass" onClick={() => setShowConfirmPass(!showConfirmPass)} aria-label="Toggle confirm password">
                    {showConfirmPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="fp-btn"
                id="fpResetBtn"
                disabled={loadingReset || filled < OTP_LENGTH}
              >
                {loadingReset ? (
                  <div className="btn-loader" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Go back to step 1 */}
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "rgba(129,140,248,0.7)", cursor: "pointer", fontSize: 13, padding: 0 }}
                  onClick={() => { setStep(1); setDigits(Array(OTP_LENGTH).fill("")); setErrorStep2(""); }}
                >
                  ← Change username
                </button>
              </div>
            </form>
          )}

          {/* Back to login */}
          <div className="login-link-row">
            Remember your password?{" "}
            <button onClick={() => navigateTo("/login")}>Sign in</button>
          </div>

        </div>
      </main>
    </div>
  );
}
