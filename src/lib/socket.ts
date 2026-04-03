import { io, type Socket } from "socket.io-client";
import { authStore } from "../features/auth/store";
import { REALTIME_ENABLED, SOCKET_URL } from "../config/api";

let socket: Socket | null = null;

const canUseRealtime = () => REALTIME_ENABLED && Boolean(SOCKET_URL);

export const getSocket = () => {
  if (!canUseRealtime()) {
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
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
  if (!instance) {
    return null;
  }

  if (!instance.connected) {
    instance.connect();
  }
  return instance;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};
