import { platformAdminAuthStore } from "../features/platform-admin/auth/store";

export type AdminApiErrorShape = {
  message: string;
  status?: number;
  details?: unknown;
};

export class AdminApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.details = details;
  }
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type AdminApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  timeoutMs?: number;
  skipRefresh?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15000;

const resolveBaseUrl = () => {
  const base =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:2300";
  return base.replace(/\/+$/, "");
};

const buildUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveBaseUrl()}${normalizedPath}`;
};

const safeParseJson = async <T,>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getAdminAuthHeader = () => {
  const token = platformAdminAuthStore.getState().accessToken;
  return token ? `Bearer ${token}` : undefined;
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAdminAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildUrl("/api/admin/refresh"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        platformAdminAuthStore.clear();
        return null;
      }

      const data = await safeParseJson<any>(response);
      const accessToken = data?.data?.accessToken ?? null;
      const admin = data?.data?.admin ?? null;

      if (accessToken) {
        platformAdminAuthStore.setAccessToken(accessToken);
      }
      if (admin) {
        platformAdminAuthStore.setAdmin(admin);
      }
      platformAdminAuthStore.setInitialized(true);

      return accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export async function adminApiRequest<T>(
  path: string,
  options: AdminApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers,
    credentials = "include",
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipRefresh = false,
  } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const authHeader = getAdminAuthHeader();
    let response = await fetch(buildUrl(path), {
      method,
      credentials,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller.signal,
    });

    if (response.status === 401 && !skipRefresh && path !== "/api/admin/refresh") {
      const nextToken = await refreshAdminAccessToken();

      if (nextToken) {
        response = await fetch(buildUrl(path), {
          method,
          credentials,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${nextToken}`,
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: signal ?? controller.signal,
        });
      }
    }

    const data = await safeParseJson<T & AdminApiErrorShape>(response);

    if (!response.ok) {
      const message =
        data?.message ||
        (response.status === 401
          ? "Unauthorized"
          : response.status === 403
            ? "Forbidden"
            : "Request failed");
      throw new AdminApiError(message, response.status, data);
    }

    return (data ?? ({} as T)) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const adminApi = {
  get: <T,>(path: string, options?: AdminApiRequestOptions) =>
    adminApiRequest<T>(path, { ...options, method: "GET" }),
  post: <T,>(path: string, body?: unknown, options?: AdminApiRequestOptions) =>
    adminApiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T,>(path: string, body?: unknown, options?: AdminApiRequestOptions) =>
    adminApiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T,>(path: string, body?: unknown, options?: AdminApiRequestOptions) =>
    adminApiRequest<T>(path, { ...options, method: "DELETE", body }),
};
