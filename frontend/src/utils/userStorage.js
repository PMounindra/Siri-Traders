export const getUserStorageId = (user) => {
  const rawId = user?.email || user?.phone || user?.id || '';
  return String(rawId).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

export const getUserStorageKey = (user, type) => {
  const id = getUserStorageId(user);
  return id ? `siri-traders-${type}-${id}` : null;
};
