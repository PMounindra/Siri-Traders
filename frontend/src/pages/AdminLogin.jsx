import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { loginAdmin } from '../utils/adminAuth';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const session = loginAdmin(email, password);
    if (!session) {
      setError('Invalid admin email or password');
      return;
    }
    navigate('/admin');
  };

  return (
    <main className="admin-login">
      <section className="admin-login__panel">
        <div className="admin-login__brand">
          <span><img src="/logo-mark.webp" alt="Siri Traders" /></span>
          <div>
            <strong>Siri Traders</strong>
            <small>Admin Control Center</small>
          </div>
        </div>
        <div className="admin-login__copy">
          <h1>Admin Login</h1>
          <p>Sign in to manage inventory, offers, coupons, customers, and site content.</p>
        </div>
        <form className="admin-login__form" onSubmit={handleSubmit}>
          {error && <p className="admin-login__error">{error}</p>}
          <label>
            <span>Email</span>
            <div>
              <FiMail />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Enter admin email" autoComplete="username" required />
            </div>
          </label>
          <label>
            <span>Password</span>
            <div>
              <FiLock />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Enter password" autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword(prev => !prev)} aria-label="Toggle password">
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>
          <button className="admin-login__submit">Login to admin</button>
        </form>
      </section>
    </main>
  );
};

export default AdminLogin;
