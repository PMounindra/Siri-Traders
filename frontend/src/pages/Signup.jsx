import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { SignUp } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

const floatingItems = ['🥬', '🍇', '🥑', '🧈', '🍊', '🥜', '🧄', '🫐', '🍋', '🥭'];

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, isClerk } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email'); return; }
    if (!phone.trim() || phone.length < 10) { setError('Please enter a valid 10-digit phone number'); return; }
    if (!agreeTerms) { setError('Please agree to Terms & Conditions'); return; }

    setLoading(true);
    setTimeout(() => {
      signup({ name, email, phone });
      navigate('/home');
    }, 800);
  };

  if (isClerk) {
    return (
      <div className="signup-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
        <SignUp signInUrl="/login" forceRedirectUrl="/home" />
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-floating" aria-hidden="true">
        {floatingItems.map((item, i) => (
          <span
            key={i}
            className="signup-floating__item"
            style={{
              '--x': `${5 + (i * 9.5) % 85}%`,
              '--y': `${3 + (i * 11) % 85}%`,
              '--delay': `${i * 0.5}s`,
              '--duration': `${5 + (i % 3) * 2}s`,
              '--size': `${22 + (i % 4) * 8}px`,
            }}
          >
            {item}
          </span>
        ))}
      </div>

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

        <form onSubmit={handleSubmit} className="signup-card__form">
          {error && <div className="signup-card__error">{error}</div>}

          <div className="signup-card__input-wrapper">
            <FiUser className="signup-card__input-icon" />
            <input type="text" placeholder="Full Name" value={name}
              onChange={(e) => setName(e.target.value)} className="signup-card__input" id="signup-name" />
          </div>

          <div className="signup-card__input-wrapper">
            <FiMail className="signup-card__input-icon" />
            <input type="email" placeholder="Email Address" value={email}
              onChange={(e) => setEmail(e.target.value)} className="signup-card__input" id="signup-email" />
          </div>

          <div className="signup-card__input-wrapper">
            <FiPhone className="signup-card__input-icon" />
            <input type="tel" placeholder="Phone Number" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="signup-card__input" id="signup-phone" />
          </div>

          <p className="signup-card__otp-note">We will verify your account with OTP. No password needed.</p>

          <label className="signup-card__terms">
            <input type="checkbox" checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)} className="signup-card__checkbox" />
            <span className="signup-card__checkbox-custom"></span>
            I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>
          </label>

          <button type="submit"
            className={`signup-card__submit ${loading ? 'signup-card__submit--loading' : ''}`}
            disabled={loading} id="signup-submit-btn">
            {loading ? <span className="signup-card__spinner"></span> : 'Create Account'}
          </button>
        </form>

        <p className="signup-card__footer">
          Already have an account? <Link to="/login" className="signup-card__link">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
