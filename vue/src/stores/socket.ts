import alerts from '@/assets/js/alerts'
import router from '@/router'
import { defineStore } from 'pinia'
import { ResponseEventType } from '@/assets/js/enums'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null as WebSocket | null,
    isConnected: false,
    chatId: -1,
    reconnectAttempt: 0,
    reconnectTimeoutId: null as number | null,
    maxReconnectInterval: 30000,
  }),
  actions: {
    connect() {
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId)
        this.reconnectTimeoutId = null
      }
      if (this.socket && this.isConnected) return

      this.socket = new WebSocket(
        `wss://${import.meta.env.VITE_BACKEND_URL}/ws/message?accessToken=${localStorage.getItem('token')}`,
      )
      this.socket.onopen = () => {
        this.isConnected = true
        this.reconnectAttempt = 0
      }

      this.socket.onmessage = async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.Type == ResponseEventType.Message_Seen) {
            window.dispatchEvent(new CustomEvent('new-seen', { detail: data.Payload.MessageReads }))
          } else if (data.Type == ResponseEventType.Message_Sent) {
            window.dispatchEvent(new CustomEvent('new-message', { detail: data.Payload.Message }))
          } else if (data.Type == ResponseEventType.Message_Deleted) {
            window.dispatchEvent(
              new CustomEvent('delete-message', { detail: data.Payload.Message }),
            )
          } else if (data.Type == ResponseEventType.Chat_Created) {
            window.dispatchEvent(new CustomEvent('new-chat', { detail: data }))
          } else if (data.Type == ResponseEventType.Chat_UserAdded) {
            window.dispatchEvent(new CustomEvent('user-join', { detail: data }))
          } else if (data.Type == ResponseEventType.Error) {
            if (data.Payload.Chat.Id != -1) {
              router.push(`/messages/${data.Payload.Chat.Id}`)
            } else {
              await alerts.errorToast(data.Payload.Error)
            }
          }
        } catch (err) {
          alerts.errorAlert('WebSocket error')
        }
      }

      this.socket.onclose = async (event) => {
        this.socket = null
        this.isConnected = false
        if (
          event.reason == 'Another device connected' ||
          event.reason == 'Session expired. Please log in again'
        ) {
          await alerts.errorAlert(event.reason)
          localStorage.clear()
          window.location.href = '/'
        } else {
          const reconnectInterval = Math.min(
            1000 * Math.pow(2, this.reconnectAttempt),
            this.maxReconnectInterval,
          )
          this.reconnectAttempt++

          this.reconnectTimeoutId = setTimeout(() => {
            this.connect()
          }, reconnectInterval)
        }
      }

      this.socket.onerror = () => {
        console.error('WebSocket error occurred.')
      }
    },

    disconnect() {
      if (this.socket) {
        this.socket.close()
        this.isConnected = false
        localStorage.clear()
        window.location.href = '/'
      }
    },

    sendMessage(socketMessage: any) {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(socketMessage))
      } else if (this.socket?.readyState === WebSocket.CONNECTING) {
        this.socket.addEventListener(
          'open',
          () => {
            this.socket?.send(JSON.stringify(socketMessage))
          },
          { once: true },
        )
      } else {
        alert('Connection error. Please refresh the page.')
      }
    },

    SetChatId(id: number) {
      this.chatId = id
    },
  },
})
