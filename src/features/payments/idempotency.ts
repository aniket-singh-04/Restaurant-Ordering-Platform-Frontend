const STORAGE_PREFIX = "restaurant-ordering:payment-idempotency";

const createSessionToken = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const buildStorageKey = (orderId: string, purpose: string) =>
  `${STORAGE_PREFIX}:${orderId}:${purpose}`;

export const getPaymentIdempotencyKey = (orderId: string, purpose: string) => {
  const storageKey = buildStorageKey(orderId, purpose);

  if (typeof window === "undefined") {
    return `${storageKey}:${createSessionToken()}`;
  }

  try {
    const existingKey = window.localStorage.getItem(storageKey);
    if (existingKey) {
      return existingKey;
    }

    const nextKey = `${storageKey}:${createSessionToken()}`;
    window.localStorage.setItem(storageKey, nextKey);
    return nextKey;
  } catch {
    return `${storageKey}:${createSessionToken()}`;
  }
};

export const clearPaymentIdempotencyKey = (orderId: string, purpose: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(buildStorageKey(orderId, purpose));
  } catch {
    // Ignore storage errors; the backend still protects duplicate attempts.
  }
};
