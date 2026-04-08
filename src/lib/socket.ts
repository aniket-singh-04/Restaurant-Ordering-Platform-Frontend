import { io, type Socket } from "socket.io-client";
import { authStore } from "../features/auth/store";
import {
  REALTIME_ENABLED,
  REALTIME_TRANSPORT,
  SOCKET_URL,
} from "../config/api";

type RealtimeHandler = (payload?: unknown) => void;

type RealtimeClient = {
  emit: (event: string, payload?: unknown) => void;
  on: (event: string, handler: RealtimeHandler) => void;
  off: (event: string, handler: RealtimeHandler) => void;
  connect: () => void;
  disconnect: () => void;
};

class SocketIoRealtimeClient implements RealtimeClient {
  private socket: Socket | null = null;

  private getSocket() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        withCredentials: true,
      });
    }

    const token = authStore.getState().accessToken;
    this.socket.auth = token ? { token } : {};
    return this.socket;
  }

  emit(event: string, payload?: unknown) {
    const socket = this.getSocket();
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit(event, payload);
  }

  on(event: string, handler: RealtimeHandler) {
    this.getSocket().on(event, handler as (...args: unknown[]) => void);
  }

  off(event: string, handler: RealtimeHandler) {
    this.socket?.off(event, handler as (...args: unknown[]) => void);
  }

  connect() {
    const socket = this.getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

class WebSocketRealtimeClient implements RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners = new Map<string, Set<RealtimeHandler>>();
  private outboundQueue: string[] = [];
  private reconnectTimer: number | null = null;
  private shouldReconnect = false;

  private buildUrl() {
    const rawUrl = SOCKET_URL.trim();
    const normalizedUrl = rawUrl.startsWith("https://")
      ? `wss://${rawUrl.slice("https://".length)}`
      : rawUrl.startsWith("http://")
        ? `ws://${rawUrl.slice("http://".length)}`
        : rawUrl;

    const url = new URL(normalizedUrl);
    const token = authStore.getState().accessToken;
    if (token) {
      url.searchParams.set("token", token);
    }

    return url.toString();
  }

  private dispatch(event: string, payload?: unknown) {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer !== null) {
      return;
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.ensureSocket();
      }
    }, 2000);
  }

  private flushOutboundQueue() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    while (this.outboundQueue.length > 0) {
      const nextMessage = this.outboundQueue.shift();
      if (!nextMessage) {
        continue;
      }
      this.socket.send(nextMessage);
    }
  }

  private handleIncomingMessage(rawData: string) {
    try {
      const parsed = JSON.parse(rawData) as {
        event?: string;
        payload?: unknown;
        data?: unknown;
      };

      if (typeof parsed.event === "string" && parsed.event.trim()) {
        this.dispatch(parsed.event, parsed.payload ?? parsed.data);
      }
    } catch {
      // Ignore malformed realtime frames so one bad message does not break the stream.
    }
  }

  private ensureSocket() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return this.socket;
    }

    this.clearReconnectTimer();

    const socket = new WebSocket(this.buildUrl());
    this.socket = socket;

    socket.onopen = () => {
      this.flushOutboundQueue();
    };

    socket.onmessage = (event) => {
      if (typeof event.data === "string") {
        this.handleIncomingMessage(event.data);
      }
    };

    socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };

    socket.onerror = () => undefined;

    return socket;
  }

  private queueOrSend(message: string) {
    const socket = this.ensureSocket();
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
      return;
    }

    this.outboundQueue.push(message);
  }

  emit(event: string, payload?: unknown) {
    const message =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? JSON.stringify({
            ...(payload as Record<string, unknown>),
            action: event,
          })
        : JSON.stringify({
            action: event,
            payload,
          });

    this.queueOrSend(message);
  }

  on(event: string, handler: RealtimeHandler) {
    const handlers = this.listeners.get(event) ?? new Set<RealtimeHandler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
  }

  off(event: string, handler: RealtimeHandler) {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  connect() {
    this.shouldReconnect = true;
    this.ensureSocket();
  }

  disconnect() {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.outboundQueue = [];

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

let realtimeClient: RealtimeClient | null = null;

const canUseRealtime = () => REALTIME_ENABLED && Boolean(SOCKET_URL);

const createRealtimeClient = () =>
  REALTIME_TRANSPORT === "websocket"
    ? new WebSocketRealtimeClient()
    : new SocketIoRealtimeClient();

export const getSocket = () => {
  if (!canUseRealtime()) {
    return null;
  }

  if (!realtimeClient) {
    realtimeClient = createRealtimeClient();
  }

  return realtimeClient;
};

export const connectSocket = () => {
  const instance = getSocket();
  if (!instance) {
    return null;
  }

  instance.connect();
  return instance;
};

export const disconnectSocket = () => {
  realtimeClient?.disconnect();
};
