/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiSmartphone, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [input, setInput] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const { login } = useAuth();
  const navigate = useNavigate();

  // Detect input mode
  const isPhone = /^\d{1,10}$/.test(input.replace(/\s/g, '')) && input.replace(/\s/g, '').length >= 1;
  const isPhoneComplete = /^\d{10}$/.test(input.replace(/\s/g, ''));
  const isEmail = input.includes('@');

  // Show toast helper
  const showToast = useCallback((message, duration = 2000) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), duration);
  }, []);

  // Reset OTP state when input changes away from phone
  useEffect(() => {
    if (!isPhone) {
      setOtpSent(false);
      setOtp(['', '', '', '']);
    }
  }, [isPhone]);

  // Validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));

    // Auto-focus next
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  // Handle OTP keydown for backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleSendOtp = () => {
    if (!input.trim()) {
      setErrors({ input: 'Please enter your email or phone number' });
      return;
    }
    if (!isPhoneComplete) {
      setErrors({ input: 'Please enter a valid 10-digit phone number' });
      return;
    }
    setOtpSent(true);
    setOtp(['', '', '', '']);
    setTimeout(() => otpRefs[0].current?.focus(), 100);
    showToast('OTP sent to your phone');
  };

  const handleEmailLogin = () => {
    if (!isValidEmail(input)) {
      setErrors({ input: 'Please enter a valid email address' });
      return;
    }
    setLoading(true);
    // Check if account exists in localStorage
    const result = login(input);
    if (!result) {
      setLoading(false);
      setErrors({ input: 'No account found with this email. Please create an account first.' });
      return;
    }
    showToast('Welcome back!', 1200);
    setTimeout(() => navigate('/home'), 400);
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length < 4) {
      setErrors({ otp: 'Please enter the complete OTP' });
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      const loggedInUser = login(input);
      if (!loggedInUser) {
        setLoading(false);
        setErrors({
          input: 'No account found with this email. Please create an account first.'
        });
        return;
      }
      showToast('Welcome back! 👋', 2000);
      setTimeout(() => navigate('/home'), 500);
    }, 1500);
  };

  // Handle email or phone OTP submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!input.trim()) {
      newErrors.input = 'Please enter your email or phone number';
    } else if (isEmail && !isValidEmail(input)) {
      newErrors.input = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEmail) {
      handleEmailLogin();
      return;
    }

    if (!otpSent) {
      handleSendOtp();
      return;
    }

    handleVerifyOtp();
  };

  // Google Sign In — placeholder ready for backend OAuth integration
  // When backend is ready, replace this with the actual OAuth redirect/SDK call
  const handleGoogleSignIn = () => {
    // TODO: wire up backend OAuth endpoint here
  };

  // Forgot Password submit
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address');
      return;
    }
    if (!isValidEmail(forgotEmail)) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setForgotSent(true);
  };

  // Close forgot modal
  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotSent(false);
    setForgotError('');
  };

  return (
    <div className="login-page">
      {/* Login card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-card__logo">
          <div className="login-card__logo-circle">
            <img src="/logo-mark.webp" alt="Siri Traders" className="login-card__logo-img" />
          </div>
        </div>

        {/* Heading */}
        <div className="login-card__header">
          <h2 className="login-card__title">Welcome Back</h2>
          <p className="login-card__subtitle">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-card__form" noValidate>
          {/* Email / Phone input */}
          <div className="login-card__field">
            <div className={`login-card__input-wrapper ${errors.input ? 'login-card__input-wrapper--error' : ''}`}>
              {isPhone ? (
                <FiSmartphone className="login-card__input-icon" />
              ) : (
                <FiMail className="login-card__input-icon" />
              )}
              <input
                type={isPhone ? 'tel' : 'text'}
                placeholder="Email or Phone Number"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setErrors((prev) => ({ ...prev, input: '' }));
                }}
                className="login-card__input"
                autoComplete="username"
              />
            </div>
            {errors.input && <span className="login-card__field-error">{errors.input}</span>}
          </div>

          {/* OTP flow */}
          {isEmail && (
            <button
              type="button"
              className="login-card__submit"
              onClick={handleEmailLogin}
              disabled={!isValidEmail(input) || loading}
            >
              <FiMail style={{ marginRight: 8 }} />
              Continue with Email
            </button>
          )}

          {isPhone && (
            <div className="login-card__otp-section">
              {!otpSent ? (
                <button
                  type="button"
                  className="login-card__send-otp"
                  onClick={handleSendOtp}
                  disabled={!isPhoneComplete}
                >
                  Send OTP
                </button>
              ) : (
                <>
                  <div className="login-card__otp-boxes">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={otpRefs[i]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`login-card__otp-input ${errors.otp ? 'login-card__otp-input--error' : ''}`}
                      />
                    ))}
                  </div>
                  {errors.otp && <span className="login-card__field-error">{errors.otp}</span>}
                  <button
                    type="button"
                    className={`login-card__submit ${loading ? 'login-card__submit--loading' : ''}`}
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="login-card__spinner" />
                    ) : (
                      <>
                        <FiCheck style={{ marginRight: 8 }} />
                        Verify OTP
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="login-card__divider">
            <span>or</span>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            className="login-card__google"
            onClick={handleGoogleSignIn}
          >
            <svg className="login-card__google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Signup link */}
        <p className="login-card__footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="login-card__link">Create Account</Link>
        </p>
      </div>

      {/* Toast */}
      <div className={`login-toast ${toast.show ? 'login-toast--visible' : ''}`}>
        {toast.message}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="login-modal-overlay" onClick={closeForgotModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="login-modal__close" onClick={closeForgotModal} aria-label="Close">
              <FiX />
            </button>
            <h3 className="login-modal__title">Reset Password</h3>
            <p className="login-modal__subtitle">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {forgotSent ? (
              <div className="login-modal__success">
                <div className="login-modal__success-icon">
                  <FiCheck />
                </div>
                <p>Reset link sent to your email</p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="login-modal__form" noValidate>
                <div className={`login-card__input-wrapper ${forgotError ? 'login-card__input-wrapper--error' : ''}`}>
                  <FiMail className="login-card__input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setForgotError('');
                    }}
                    className="login-card__input"
                    autoFocus
                  />
                </div>
                {forgotError && <span className="login-card__field-error">{forgotError}</span>}
                <button type="submit" className="login-card__submit">
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
