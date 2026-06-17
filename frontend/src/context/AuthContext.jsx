/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const ACCOUNTS_KEY = 'siri-traders-accounts';

export const getAccounts = () => {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveAccount = (account) => {
  const normalizedEmail = account.email?.toLowerCase();
  const accounts = getAccounts().filter(item => item.email?.toLowerCase() !== normalizedEmail);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([account, ...accounts]));
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('siri-traders-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('siri-traders-location');
      return saved ? JSON.parse(saved) : { address: 'Your address', city: '' };
    } catch {
      return { address: 'Your address', city: '' };
    }
  });

  const [customerType, setCustomerType] = useState(() => {
    try {
      return localStorage.getItem('siri-traders-customer-type') || 'retail';
    } catch {
      return 'retail';
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('siri-traders-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('siri-traders-user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('siri-traders-location', JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    localStorage.setItem('siri-traders-customer-type', customerType);
  }, [customerType]);

  const login = (email) => {
    const normalizedInput = email.trim().toLowerCase();
    const isEmailLogin = normalizedInput.includes('@');

    if (isEmailLogin) {
      const existingAccount = getAccounts().find(
        account => account.email?.toLowerCase() === normalizedInput
      );
      if (!existingAccount) {
        return null;
      }
      const loggedInUser = {
        id: existingAccount.id,
        name: existingAccount.name,
        email: existingAccount.email,
        phone: existingAccount.phone,
        avatar: null,
        isAdmin: existingAccount.email.toLowerCase().includes('admin')
      };
      setUser(loggedInUser);
      return loggedInUser;
    }

    // Phone login (OTP flow)
    const mockUser = {
      id: Date.now(),
      name: 'User',
      email: `${normalizedInput}@siritraders.com`,
      phone: email.trim(),
      avatar: null,
      isAdmin: false
    };
    setUser(mockUser);
    return mockUser;
  };

  const signup = (userData) => {
    const newUser = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      avatar: null,
      isAdmin: false
    };
    saveAccount(newUser);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('siri-traders-user');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
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
