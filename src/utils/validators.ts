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

export const isStrongPassword = (value: string, minLength = 8) =>
  value.trim().length >= minLength;

