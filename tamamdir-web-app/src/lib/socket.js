import { io } from 'socket.io-client'

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

let socket = null

export function getSocket() {
  const token = localStorage.getItem('token')
  if (!token) return null

  if (socket?.connected) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(BASE, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinConversation(conversationId) {
  const s = getSocket()
  if (s && conversationId) s.emit('conversation:join', { conversationId })
}

export function leaveConversation(conversationId) {
  if (socket && conversationId) socket.emit('conversation:leave', { conversationId })
}
