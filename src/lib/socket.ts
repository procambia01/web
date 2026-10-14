import { io, type Socket } from 'socket.io-client'
import { SOCKET_URL } from './constants'
import { refreshSession, tokenStore } from './api'

let socket: Socket | null = null

/** One shared realtime connection; the token is re-read (and refreshed) on every (re)connect. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 15_000,
      auth: (cb) => {
        void (async () => {
          if (tokenStore.stale()) await refreshSession()
          cb({ token: tokenStore.get() ?? '' })
        })()
      },
    })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
