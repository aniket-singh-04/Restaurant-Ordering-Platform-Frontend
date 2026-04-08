const DEFAULT_DEV_API_BASE_URL = "http://localhost:2300";
const DEFAULT_PROD_API_BASE_URL = "https://api.mealtap.in";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

const normalizeRealtimeTransport = (
  value: string | undefined,
): "socketio" | "websocket" | "" => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "socketio" || normalized === "websocket") {
    return normalized;
  }

  return "";
};

const normalizeBoolean = (value: string | undefined, defaultValue: boolean) => {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
};

const defaultApiBaseUrl = import.meta.env.PROD
  ? DEFAULT_PROD_API_BASE_URL
  : DEFAULT_DEV_API_BASE_URL;

export const API_BASE_URL = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    defaultApiBaseUrl,
);

export const REALTIME_ENABLED = normalizeBoolean(
  import.meta.env.VITE_ENABLE_REALTIME,
  !import.meta.env.PROD,
);

export const SOCKET_URL = (() => {
  const rawSocketUrl =
    import.meta.env.VITE_SOCKET_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim() ||
    defaultApiBaseUrl;

  if (!REALTIME_ENABLED || !rawSocketUrl) {
    return "";
  }

  return normalizeUrl(rawSocketUrl);
})();

export const REALTIME_TRANSPORT = (() => {
  const explicitTransport = normalizeRealtimeTransport(
    import.meta.env.VITE_REALTIME_TRANSPORT,
  );
  if (explicitTransport) {
    return explicitTransport;
  }

  if (SOCKET_URL.startsWith("ws://") || SOCKET_URL.startsWith("wss://")) {
    return "websocket" as const;
  }

  return "socketio" as const;
})();

export const buildApiUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
