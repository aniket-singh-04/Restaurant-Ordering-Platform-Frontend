import { sanitizeHtml } from "../security";

type SafeHtmlProps = {
  html: string;
  className?: string;
};

const isSafeRenderedHref = (href: string) => {
  const trimmedHref = href.trim();

  if (!trimmedHref) {
    return null;
  }

  if (trimmedHref.startsWith("#") || trimmedHref.startsWith("?")) {
    return trimmedHref;
  }

  try {
    const resolvedUrl = new URL(trimmedHref, window.location.origin);

    if (resolvedUrl.protocol !== "http:" && resolvedUrl.protocol !== "https:") {
      return null;
    }

    return resolvedUrl.toString();
  } catch {
    return null;
  }
};

const normalizeAnchors = (html: string) => {
  if (typeof window === "undefined" || !html) {
    return html;
  }

  const parsedDocument = new DOMParser().parseFromString(html, "text/html");

  parsedDocument.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href");

    if (!href) {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      return;
    }

    const safeHref = isSafeRenderedHref(href);

    if (!safeHref) {
      anchor.removeAttribute("href");
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      return;
    }

    anchor.setAttribute("href", safeHref);

    const opensNewTab = anchor.getAttribute("target") === "_blank";
    const isExternalLink = new URL(safeHref, window.location.origin).origin !== window.location.origin;

    if (opensNewTab || isExternalLink) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
      return;
    }

    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
  });

  return parsedDocument.body.innerHTML;
};

export default function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitizedHtml = normalizeAnchors(sanitizeHtml(html));

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
