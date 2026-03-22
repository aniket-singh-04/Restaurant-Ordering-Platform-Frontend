import { create } from "zustand";
import type { QrContext } from "./api";

type QrContextState = {
  context: QrContext | null;
  setContext: (context: QrContext | null) => void;
  clear: () => void;
};

export const useQrContextStore = create<QrContextState>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
  clear: () => set({ context: null }),
}));
