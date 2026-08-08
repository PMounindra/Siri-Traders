export const getUserStorageId = (user) => {
  const rawId = user?.email || user?.phone || user?.id || '';
  return String(rawId).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

export const getUserStorageKey = (user, type) => {
  const id = getUserStorageId(user);
  return id ? `siri-traders-${type}-${id}` : null;
};

export const getSavedAddresses = (user) => {
  try {
    const key = getUserStorageKey(user, 'addresses');
    const saved = key ? localStorage.getItem(key) : null;
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};
