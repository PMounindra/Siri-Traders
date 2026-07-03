import { SignIn } from '@clerk/clerk-react';
import './Login.css';

const clerkAppearance = {
  variables: {
    colorPrimary: '#2D5016',
    colorBackground: '#ffffff',
    colorText: '#1c1c1c',
    colorTextSecondary: '#687466',
    colorInputBackground: '#F1F8E9',
    colorInputText: '#1c1c1c',
    colorDanger: '#FF6B35',
    borderRadius: '10px',
    fontFamily: 'Poppins, sans-serif',
    fontSize: '14px',
  },
  layout: { logoPlacement: 'none' },
  elements: {
    /* Let Clerk own the internal alignment; we only strip its outer chrome
       so the form sits cleanly inside our branded card. */
    rootBox: { width: '100%' },
    cardBox: {
      width: '100%',
      boxShadow: 'none',
      border: 'none',
      background: 'transparent',
    },
    card: {
      width: '100%',
      boxShadow: 'none',
      border: 'none',
      background: 'transparent',
      margin: '0',
      padding: '0',
    },
    header: { display: 'none' },
    logoBox: { display: 'none' },
    socialButtonsBlockButton: {
      border: '1.5px solid rgba(45,80,22,0.18)',
      fontWeight: '600',
    },
    formFieldInput: {
      borderColor: 'rgba(45,80,22,0.2)',
    },
    formButtonPrimary: {
      background: '#2D5016',
      color: '#ffffff',
      fontWeight: '700',
      height: '46px',
      textTransform: 'none',
    },
    footerActionLink: { color: '#3A6B1A', fontWeight: '700' },
  },
};

const Login = () => (
  <div className="login-page">
    <div className="login-card">
      <div className="login-top">
        <div className="login-logo-circle">
          <img src="/logo-mark.webp" alt="Siri Traders" className="login-logo-img" />
        </div>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to your Siri Traders account</p>
      </div>

      <div className="login-clerk-wrap">
        <SignIn
          signUpUrl="/signup"
          forceRedirectUrl="/home"
          appearance={clerkAppearance}
        />
      </div>
    </div>
  </div>
);

export default Login;
