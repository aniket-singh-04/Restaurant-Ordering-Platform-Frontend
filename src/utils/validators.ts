export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPhone = (value: string) =>
  /^[0-9]{10}$/.test(value.trim());

export const isValidOtp = (value: string) =>
  /^[0-9]{4,6}$/.test(value.trim());

export const isValidGst = (value: string) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    value.trim().toUpperCase(),
  );

export const isValidPan = (value: string) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());

export const isValidName = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  // Reject control characters
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  return true;
};

export const isStrongPassword = (value: string, minLength = 8) => {
  if (value.length < minLength) return false;
  // Reject all-whitespace passwords
  if (!value.trim()) return false;
  return true;
};
