import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import Loading from '../components/Loading';

// Clerk redirects here after a Google (or other OAuth) sign-in/sign-up
// completes — this just finishes the handshake and forwards to whatever
// redirectUrlComplete was passed to authenticateWithRedirect().
const SsoCallback = () => (
  <>
    <Loading />
    <AuthenticateWithRedirectCallback />
  </>
);

export default SsoCallback;
