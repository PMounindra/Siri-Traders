import { SignUp } from '@clerk/clerk-react';
import './Signup.css';

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

const Signup = () => (
  <div className="signup-page">
    <div className="signup-card">
      <div className="signup-top">
        <div className="signup-logo-circle">
          <img src="/logo-mark.webp" alt="Siri Traders" className="signup-logo-img" />
        </div>
        <h2 className="signup-title">Create Account</h2>
        <p className="signup-subtitle">Join Siri Traders for quick grocery delivery</p>
      </div>

      <div className="signup-clerk-wrap">
        <SignUp
          signInUrl="/login"
          forceRedirectUrl="/home"
          appearance={clerkAppearance}
        />
      </div>
    </div>
  </div>
);

export default Signup;
