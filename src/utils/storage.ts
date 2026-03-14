export const getStorageItem = (key: string) => localStorage.getItem(key);

export const setStorageItem = (key: string, value: string) =>
  localStorage.setItem(key, value);

export const removeStorageItem = (key: string) => localStorage.removeItem(key);

export const getNumericStorageItem = (key: string) => {
  const stored = getStorageItem(key);
  if (stored === null) return null;

  const parsed = Number(stored);
  return Number.isNaN(parsed) ? null : parsed;
};

export function getJsonStorageItem<T>(key: string, fallback: T) {
  try {
    const stored = getStorageItem(key);
    if (stored === null) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function setJsonStorageItem<T>(key: string, value: T) {
  try {
    setStorageItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}
