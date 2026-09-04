import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { FiPhone, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import './Login.css';
import './AuthForm.css';

const firstErrorMessage = (err, fallback) =>
  err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || fallback;

const Login = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const [mode, setMode] = useState('phone'); // 'phone' | 'email'
  const [step, setStep] = useState('identify'); // 'identify' | 'otp'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneFactor, setPhoneFactor] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetToIdentify = () => {
    setStep('identify');
    setOtp('');
    setError('');
    setPhoneFactor(null);
  };

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    resetToIdentify();
  };

  const handleOAuthSignIn = async (strategy) => {
    if (!isLoaded || submitting) return;
    setError('');
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/home',
      });
    } catch (err) {
      setError(firstErrorMessage(err, 'Failed to start sign-in.'));
    }
  };

  const handlePhoneSubmit = async (event) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setSubmitting(true);
    try {
      const attempt = await signIn.create({ identifier: `+91${digits}` });
      const factor = attempt.supportedFirstFactors?.find(f => f.strategy === 'phone_code');
      if (!factor) {
        setError("Phone sign-in isn't available for this account. Try Email instead.");
        return;
      }
      await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: factor.phoneNumberId });
      setPhoneFactor(factor);
      setStep('otp');
    } catch (err) {
      setError(firstErrorMessage(err, "We couldn't find an account with that number. Check the number or sign up."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    if (!isLoaded || submitting || otp.trim().length < 4) return;
    setError('');
    setSubmitting(true);
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'phone_code', code: otp.trim() });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/home');
      } else {
        setError('Verification incomplete — please try again.');
      }
    } catch (err) {
      setError(firstErrorMessage(err, 'Invalid or expired code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!isLoaded || !phoneFactor || submitting) return;
    setError('');
    try {
      await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: phoneFactor.phoneNumberId });
    } catch (err) {
      setError(firstErrorMessage(err, 'Failed to resend the code.'));
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (!isLoaded || submitting) return;
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/home');
      } else {
        setError('Sign-in incomplete — please try again.');
      }
    } catch (err) {
      setError(firstErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-top">
          <div className="login-logo-circle">
            <img src="/logo-mark.webp" alt="Siri Traders" className="login-logo-img" />
          </div>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your Siri Traders account</p>
        </div>

        <div className="auth-oauth-group">
          <button type="button" className="auth-oauth-btn" onClick={() => handleOAuthSignIn('oauth_google')} disabled={submitting}>
            <FcGoogle /> Continue with Google
          </button>
          <button type="button" className="auth-oauth-btn" onClick={() => handleOAuthSignIn('oauth_facebook')} disabled={submitting}>
            <FaFacebook color="#1877F2" /> Continue with Facebook
          </button>
        </div>

        <div className="auth-divider">or</div>

        <div className="auth-mode-tabs">
          <button type="button" className={`auth-mode-tab ${mode === 'phone' ? 'auth-mode-tab--active' : ''}`} onClick={() => switchMode('phone')}>
            <FiPhone /> Phone
          </button>
          <button type="button" className={`auth-mode-tab ${mode === 'email' ? 'auth-mode-tab--active' : ''}`} onClick={() => switchMode('email')}>
            <FiMail /> Email
          </button>
        </div>

        {mode === 'phone' && step === 'identify' && (
          <form className="auth-form" onSubmit={handlePhoneSubmit}>
            <label className="auth-field">
              <span>Mobile Number</span>
              <div className="auth-field-input">
                <span className="auth-field-prefix">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  required
                  autoFocus
                />
              </div>
            </label>
            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {mode === 'phone' && step === 'otp' && (
          <form className="auth-form" onSubmit={handleOtpSubmit}>
            <p className="auth-otp-hint">Enter the code sent to +91 {phone}</p>
            <label className="auth-field">
              <span>OTP Code</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="auth-otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                autoFocus
              />
            </label>
            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <div className="auth-form-links">
              <button type="button" className="auth-link-btn" onClick={handleResendOtp}>Resend OTP</button>
              <button type="button" className="auth-link-btn" onClick={resetToIdentify}>Change number</button>
            </div>
          </form>
        )}

        {mode === 'email' && (
          <form className="auth-form" onSubmit={handleEmailSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <div className="auth-field-input">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
                <button type="button" className="auth-field-eye" onClick={() => setShowPassword(p => !p)} aria-label="Toggle password visibility">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>
            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-footer-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
