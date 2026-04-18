import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "compact";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

/**
 * Cloudflare Turnstile invisible/managed challenge widget.
 *
 * Renders a Turnstile box that calls `onVerify(token)` when the user passes
 * the challenge.  The widget auto-adapts to the current theme.
 *
 * Requires the Turnstile script loaded via `?render=explicit` in index.html.
 */
export default function Turnstile({
  siteKey,
  onVerify,
  onError,
  onExpire,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const stableOnVerify = useCallback(onVerify, [onVerify]);
  const stableOnError = useCallback(() => onError?.(), [onError]);
  const stableOnExpire = useCallback(() => onExpire?.(), [onExpire]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;

      /* Remove previous widget if re-rendering */
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch { /* ignore */ }
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: stableOnVerify,
        "error-callback": stableOnError,
        "expired-callback": stableOnExpire,
        theme: "auto",
      });
    };

    /* Turnstile script may still be loading — poll until ready. */
    if (window.turnstile) {
      renderWidget();
    } else {
      pollTimer = setInterval(() => {
        if (window.turnstile) {
          if (pollTimer) clearInterval(pollTimer);
          renderWidget();
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, stableOnVerify, stableOnError, stableOnExpire]);

  return <div ref={containerRef} className="mt-1" />;
}
