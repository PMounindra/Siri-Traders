import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiSmartphone, FiArrowLeft } from 'react-icons/fi';
import { useSignIn } from '@clerk/react-router';
import './Login.css';

const ClerkSignIn = () => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('identifier'); // 'identifier' | 'verify'
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifyStrategy, setVerifyStrategy] = useState('');
  const { signIn, isLoaded, setActive } = useSignIn();
  const navigate = useNavigate();

  const isPhone = /^\d+$/.test(input.replace(/\s/g, '')) && input.replace(/\s/g, '').length >= 1;
  const isPhoneComplete = /^\d{10}$/.test(input.replace(/\s/g, ''));
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canContinue = isValidEmail(input.trim()) || isPhoneComplete;

  // Handle code input
  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError('');
    if (value && index < 5) {
      const el = document.getElementById(`otp-${index + 1}`);
      el?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = [...code];
      for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
      setCode(next);
      document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
    }
  };

  // Step 1: Send identifier to Clerk
  const handleContinue = async (e) => {
    e.preventDefault();
    if (!isLoaded || !canContinue) {
      if (!isLoaded) setError('Authentication is loading, please wait...');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const identifier = input.trim();
      const result = await signIn.create({ identifier });

      if (result.status === 'needs_first_factor') {
        const factors = result.supportedFirstFactors || [];
        const emailCode = factors.find(f => f.strategy === 'email_code');
        const phoneCode = factors.find(f => f.strategy === 'phone_code');

        if (emailCode) {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: emailCode.emailAddressId });
          setVerifyStrategy('email_code');
          setStep('verify');
        } else if (phoneCode) {
          await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: phoneCode.phoneNumberId });
          setVerifyStrategy('phone_code');
          setStep('verify');
        } else {
          setError('No supported sign-in method found for this account.');
        }
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/home');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP code
  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length < 6) { setError('Enter the full 6-digit code'); return; }
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({ strategy: verifyStrategy, code: otp });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/home');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth
  const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      setError('Authentication is loading, please wait...');
      return;
    }
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sign-in/sso-callback',
        redirectUrlComplete: '/home',
      });
    } catch (err) {
      console.error('Google error:', err);
      setError(err?.errors?.[0]?.message || 'Google sign-in failed.');
    }
  };

  // Go back to identifier step
  const goBack = () => {
    setStep('identifier');
    setCode(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="login-page">
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

        {step === 'identifier' && (
          <>
            <form onSubmit={handleContinue} className="login-card__form" noValidate>
              <div className="login-card__field">
                <div className={`login-card__input-wrapper ${error ? 'login-card__input-wrapper--error' : ''}`}>
                  {isPhone ? (
                    <FiSmartphone className="login-card__input-icon" />
                  ) : (
                    <FiMail className="login-card__input-icon" />
                  )}
                  <input
                    type={isPhone ? 'tel' : 'text'}
                    placeholder="Email or Phone Number"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(''); }}
                    className="login-card__input"
                    autoComplete="username"
                  />
                </div>
                {error && <span className="login-card__field-error">{error}</span>}
              </div>

              <button
                type="submit"
                className={`login-card__submit ${loading ? 'login-card__submit--loading' : ''}`}
                disabled={loading}
              >
                {loading ? <span className="login-card__spinner" /> : 'Continue'}
              </button>

              <div className="login-card__divider"><span>or</span></div>

              <button type="button" className="login-card__google" onClick={handleGoogleSignIn}>
                <svg className="login-card__google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </form>

            <p className="login-card__footer">
              Don&apos;t have an account?{' '}
              <Link to="/sign-up" className="login-card__link">Create Account</Link>
            </p>
          </>
        )}

        {step === 'verify' && (
          <div className="login-card__form">
            <button type="button" className="login-card__back" onClick={goBack}>
              <FiArrowLeft /> Back
            </button>
            <p className="login-card__verify-text">
              Enter the 6-digit code sent to <strong>{input}</strong>
            </p>
            <div className="login-card__otp-boxes">
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  className={`login-card__otp-input ${error ? 'login-card__otp-input--error' : ''}`}
                />
              ))}
            </div>
            {error && <span className="login-card__field-error">{error}</span>}
            <button
              type="button"
              className={`login-card__submit ${loading ? 'login-card__submit--loading' : ''}`}
              onClick={handleVerify}
              disabled={loading || code.join('').length < 6}
            >
              {loading ? <span className="login-card__spinner" /> : 'Verify & Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClerkSignIn;
