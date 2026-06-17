import { SignUp } from '@clerk/react-router';
import './ClerkAuth.css';

const ClerkSignUp = () => {
  return (
    <main className="clerk-auth">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/home"
      />
    </main>
  );
};

export default ClerkSignUp;
