/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/react-router';

const AuthContext = createContext();

/**
 * Stub for backward compatibility — Admin page imports this.
 * Customer accounts are now managed by Clerk.
 * TODO (backend): Replace with API call to fetch customers from Neon DB.
 */
export const getAccounts = () => {
  try {
    const saved = localStorage.getItem('siri-traders-accounts');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // ── Clerk user state ──
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Map Clerk user to the app's user shape
  const user = isLoaded && isSignedIn && clerkUser ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    phone: clerkUser.primaryPhoneNumber?.phoneNumber || '',
    avatar: clerkUser.imageUrl || null,
    isAdmin: false,
  } : null;

  const isAuthenticated = !!user;

  // ── Location state (localStorage, independent of Clerk) ──
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('siri-traders-location');
      return saved ? JSON.parse(saved) : { address: 'Your address', city: '' };
    } catch {
      return { address: 'Your address', city: '' };
    }
  });

  // ── Customer type state (localStorage, independent of Clerk) ──
  const [customerType, setCustomerType] = useState(() => {
    try {
      return localStorage.getItem('siri-traders-customer-type') || 'retail';
    } catch {
      return 'retail';
    }
  });

  useEffect(() => {
    localStorage.setItem('siri-traders-location', JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    localStorage.setItem('siri-traders-customer-type', customerType);
  }, [customerType]);

  // ── Logout via Clerk ──
  const logout = () => {
    signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoaded,
        logout,
        location,
        setLocation,
        customerType,
        setCustomerType
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
