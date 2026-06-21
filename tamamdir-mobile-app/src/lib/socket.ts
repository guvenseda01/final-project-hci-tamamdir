import { io, type Socket } from "socket.io-client";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(BASE || undefined, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinConversation(conversationId: string) {
  const s = getSocket();
  if (s && conversationId) s.emit("conversation:join", { conversationId });
}

export function leaveConversation(conversationId: string) {
  if (socket && conversationId) socket.emit("conversation:leave", { conversationId });
}
