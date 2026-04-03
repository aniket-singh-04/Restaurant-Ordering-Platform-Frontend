import DOMPurify from "dompurify";

const ALLOWED_HTML_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "u",
  "ul",
] as const;

const ALLOWED_HTML_ATTRS = ["href", "rel", "target"] as const;

const isSafeHttpProtocol = (protocol: string) =>
  protocol === "http:" || protocol === "https:";

const getAppOrigin = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.origin;
};

export const sanitizeHtml = (html: string): string => {
  if (!html.trim()) {
    return "";
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_HTML_TAGS],
    ALLOWED_ATTR: [...ALLOWED_HTML_ATTRS],
    FORBID_TAGS: ["iframe", "script", "style"],
    FORBID_ATTR: ["style"],
  });
};

export const isTrustedAppUrl = (url: string): boolean => {
  const appOrigin = getAppOrigin();
  const trimmedUrl = url.trim();

  if (!appOrigin || !trimmedUrl) {
    return false;
  }

  try {
    const resolvedUrl = new URL(trimmedUrl, appOrigin);

    return (
      resolvedUrl.origin === appOrigin &&
      isSafeHttpProtocol(resolvedUrl.protocol)
    );
  } catch {
    return false;
  }
};
