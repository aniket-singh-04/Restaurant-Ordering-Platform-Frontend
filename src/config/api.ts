const DEFAULT_DEV_API_BASE_URL = "http://localhost:2300";
const DEFAULT_PROD_API_BASE_URL = "https://api.mealtap.in";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

const defaultApiBaseUrl = import.meta.env.PROD
  ? DEFAULT_PROD_API_BASE_URL
  : DEFAULT_DEV_API_BASE_URL;

export const API_BASE_URL = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    defaultApiBaseUrl,
);

export const buildApiUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
