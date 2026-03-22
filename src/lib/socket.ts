import { io, type Socket } from "socket.io-client";
import { authStore } from "../features/auth/store";

let socket: Socket | null = null;

const resolveSocketUrl = () =>
  (import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:2300").replace(/\/+$/, "");

export const getSocket = () => {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      autoConnect: false,
      withCredentials: true,
    });
  }

  const token = authStore.getState().accessToken;
  socket.auth = token ? { token } : {};
  return socket;
};

export const connectSocket = () => {
  const instance = getSocket();
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};
