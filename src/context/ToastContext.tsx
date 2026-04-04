import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-[color:color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color:var(--success-soft)] text-[color:var(--success)]",
  error: "border-[color:color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
  info: "border-[color:color-mix(in_srgb,var(--info)_28%,transparent)] bg-[color:var(--info-soft)] text-[color:var(--info)]",
  warning: "border-[color:color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color:var(--warning-soft)] text-[color:var(--warning)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const durationMs = toast.durationMs ?? 4000;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), durationMs);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      dismissToast,
      clearToasts: () => setToasts([]),
    }),
    [toasts, pushToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-60 flex w-[min(420px,90vw)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-[1.35rem] border p-4 shadow-[var(--shadow-md)] backdrop-blur ${variantStyles[toast.variant ?? "info"]}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[color:var(--text-primary)]">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-xs font-semibold text-[color:var(--text-muted)] transition hover:text-[color:var(--text-primary)]"
                aria-label="Dismiss notification"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}
