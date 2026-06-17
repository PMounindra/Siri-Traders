import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiArrowLeft } from 'react-icons/fi';
import { useSignUp } from '@clerk/react-router';
import './Signup.css';

const ClerkSignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { signUp, isLoaded, setActive } = useSignUp();
  const navigate = useNavigate();

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError('');
    if (value && index < 5) {
      document.getElementById(`signup-otp-${index + 1}`)?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`signup-otp-${index - 1}`)?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = [...code];
      for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
      setCode(next);
      document.getElementById(`signup-otp-${Math.min(pasted.length, 5)}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) { setError('Loading, please wait...'); return; }
    if (!name.trim()) { setError('Name is required'); return; }
    if (!isValidEmail(email)) { setError('Valid email is required'); return; }
    if (!agreeTerms) { setError('Please agree to Terms & Conditions'); return; }

    setError('');
    setLoading(true);

    try {
      const params = {
        firstName: name.trim().split(' ')[0],
        lastName: name.trim().split(' ').slice(1).join(' ') || undefined,
        emailAddress: email.trim(),
      };
      if (phone.length === 10) {
        params.phoneNumber = `+91${phone}`;
      }

      await signUp.create(params);
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length < 6) { setError('Enter the full 6-digit code'); return; }
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/home');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) { setError('Loading, please wait...'); return; }
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sign-up/sso-callback',
        redirectUrlComplete: '/home',
      });
    } catch (err) {
      console.error('Google error:', err);
      setError(err?.errors?.[0]?.message || 'Google sign-up failed.');
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-card__logo">
          <div className="signup-card__logo-circle">
            <img src="/logo-mark.webp" alt="Siri Traders" className="signup-card__logo-img" />
          </div>
        </div>

        <div className="signup-card__header">
          <h2 className="signup-card__title">Create Account</h2>
          <p className="signup-card__subtitle">Join us for quick grocery delivery</p>
        </div>

        {step === 'form' && (
          <>
            <form onSubmit={handleSubmit} className="signup-card__form">
              {error && <div className="signup-card__error">{error}</div>}

              <div className="signup-card__input-wrapper">
                <FiUser className="signup-card__input-icon" />
                <input type="text" placeholder="Full Name" value={name}
                  onChange={(e) => setName(e.target.value)} className="signup-card__input" />
              </div>

              <div className="signup-card__input-wrapper">
                <FiMail className="signup-card__input-icon" />
                <input type="email" placeholder="Email Address" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="signup-card__input" />
              </div>

              <div className="signup-card__input-wrapper">
                <FiPhone className="signup-card__input-icon" />
                <input type="tel" placeholder="Phone Number (optional)" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="signup-card__input" />
              </div>

              <label className="signup-card__terms">
                <input type="checkbox" checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)} className="signup-card__checkbox" />
                <span className="signup-card__checkbox-custom"></span>
                I agree to the <a href="/info#terms">Terms & Conditions</a> and <a href="/info#privacy">Privacy Policy</a>
              </label>

              <button type="submit"
                className={`signup-card__submit ${loading ? 'signup-card__submit--loading' : ''}`}
                disabled={loading}>
                {loading ? <span className="signup-card__spinner"></span> : 'Create Account'}
              </button>

              <div className="login-card__divider"><span>or</span></div>

              <button type="button" className="login-card__google" onClick={handleGoogleSignUp}>
                <svg className="login-card__google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </form>

            <p className="signup-card__footer">
              Already have an account? <Link to="/sign-in" className="signup-card__link">Login</Link>
            </p>
          </>
        )}

        {step === 'verify' && (
          <div className="signup-card__form">
            <button type="button" className="login-card__back" onClick={() => { setStep('form'); setCode(['','','','','','']); setError(''); }}>
              <FiArrowLeft /> Back
            </button>
            <p className="login-card__verify-text">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <div className="login-card__otp-boxes">
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`signup-otp-${i}`}
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
              {loading ? <span className="login-card__spinner" /> : 'Verify & Create Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClerkSignUp;
