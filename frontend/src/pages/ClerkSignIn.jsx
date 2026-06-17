import { SignIn } from '@clerk/react-router';
import './ClerkAuth.css';

const ClerkSignIn = () => {
  return (
    <main className="clerk-auth">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/home"
      />
    </main>
  );
};

export default ClerkSignIn;
