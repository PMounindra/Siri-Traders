import { SignUp } from '@clerk/clerk-react';
import './Signup.css';

const Signup = () => (
  <div className="signup-page">
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
        appearance={{
          variables: {
            colorPrimary: '#2D5016',
            colorBackground: '#ffffff',
            colorText: '#1c1c1c',
            colorTextSecondary: '#687466',
            colorInputBackground: '#F1F8E9',
            colorInputText: '#1c1c1c',
            borderRadius: '10px',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            spacingUnit: '16px',
          },
          layout: { logoPlacement: 'none' },
          elements: {
            rootBox: { width: '100%' },
            cardBox: { width: '100%', boxShadow: 'none', margin: '0' },
            card: {
              width: '100%',
              boxShadow: 'none',
              border: 'none',
              background: 'transparent',
              margin: '0',
              padding: '24px',
            },
            main: { width: '100%' },
            header: { display: 'none' },
            headerTitle: { display: 'none' },
            headerSubtitle: { display: 'none' },
            logoBox: { display: 'none' },
            form: { width: '100%' },
            formField: { width: '100%', boxSizing: 'border-box' },
            formFieldRow: {
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box',
            },
            formFieldInput: {
              width: '100%',
              boxSizing: 'border-box',
              borderColor: 'rgba(45,80,22,0.2)',
              background: '#F1F8E9',
              borderRadius: '10px',
            },
            formFieldLabel: {
              display: 'block',
              width: '100%',
              textAlign: 'left',
            },
            socialButtonsBlockButton: {
              width: '100%',
              border: '1.5px solid rgba(45,80,22,0.2)',
              borderRadius: '10px',
              fontWeight: '700',
            },
            formButtonPrimary: {
              width: '100%',
              background: '#2D5016',
              color: '#ffffff',
              fontWeight: '800',
              borderRadius: '10px',
              height: '46px',
            },
            footerActionLink: { color: '#3A6B1A', fontWeight: '700' },
          },
        }}
      />
    </div>
  </div>
);

export default Signup;
