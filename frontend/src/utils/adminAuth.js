const ADMIN_ACCOUNTS_KEY = 'siri-admin-accounts';
const ADMIN_SESSION_KEY = 'siri-admin-session';

export const defaultAdminCredentials = {
  email: 'admin@siritraders.com',
  password: 'Admin@123'
};

const defaultAdmin = {
  id: 'admin-root',
  name: 'Siri Admin',
  email: defaultAdminCredentials.email,
  password: defaultAdminCredentials.password,
  role: 'Owner',
  createdAt: 'Default'
};

const normalizeAdminAccount = (account) => ({
  ...account,
  email: String(account.email || '').trim().toLowerCase(),
  password: String(account.password || '').trim()
});

export const getAdminAccounts = () => {
  try {
    const saved = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    const accounts = saved ? JSON.parse(saved).map(normalizeAdminAccount) : [];
    const hasDefault = accounts.some(account => account.email.toLowerCase() === defaultAdmin.email);
    const nextAccounts = hasDefault ? accounts : [defaultAdmin, ...accounts];
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    return nextAccounts;
  } catch {
    return [defaultAdmin];
  }
};

export const saveAdminAccounts = (accounts) => {
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts.map(normalizeAdminAccount)));
};

const getPendingAdminAccounts = () => {
  try {
    const saved = localStorage.getItem(`${ADMIN_ACCOUNTS_KEY}-pending`);
    return saved ? JSON.parse(saved).map(normalizeAdminAccount) : [];
  } catch {
    return [];
  }
};

export const savePendingAdminAccount = (account) => {
  const normalizedAccount = normalizeAdminAccount(account);
  const nextPending = [normalizedAccount, ...getPendingAdminAccounts().filter(item => item.email.toLowerCase() !== normalizedAccount.email.toLowerCase())];
  localStorage.setItem(`${ADMIN_ACCOUNTS_KEY}-pending`, JSON.stringify(nextPending));
};

export const loginAdmin = (email, password) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();
  const admin = [...getPendingAdminAccounts(), ...getAdminAccounts()].find(account =>
    account.email.toLowerCase() === normalizedEmail && account.password === normalizedPassword
  );

  if (!admin) return null;

  const session = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getAdminSession = () => {
  try {
    const saved = localStorage.getItem(ADMIN_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const logoutAdmin = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};
