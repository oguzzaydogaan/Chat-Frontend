import alerts from '@/assets/js/alerts'
import router from '@/router'
import { defineStore } from 'pinia'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null as WebSocket | null,
    isConnected: false,
    chatId: 0,
  }),
  actions: {
    connect() {
      if (this.socket && this.isConnected) return

      this.socket = new WebSocket(
        `wss://${import.meta.env.VITE_BACKEND_URL}/ws/message?accessToken=${localStorage.getItem('token')}`,
      )

      this.socket.onopen = () => {
        this.isConnected = true
        console.log('Opened.')
      }

      this.socket.onmessage = async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.Type == 'Send-Message') {
            window.dispatchEvent(new CustomEvent('new-message', { detail: data.Payload.Message }))
          } else if (data.Type == 'Delete-Message') {
            window.dispatchEvent(
              new CustomEvent('delete-message', { detail: data.Payload.Message }),
            )
          } else if (data.Type == 'New-Chat') {
            window.dispatchEvent(new CustomEvent('new-chat', { detail: data.Payload.Chat }))
          } else if (data.Type == 'New-UserToChat') {
            window.dispatchEvent(new CustomEvent('user-join', { detail: data.Payload.Chat }))
          } else if (data.Type == 'Error') {
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
        await alerts.errorAlert(event.reason || 'Server not responding')
        if (
          event.reason == 'Another device connected' ||
          event.reason == 'Session expired. Please log in again'
        ) {
          localStorage.clear()
          window.location.href = '/'
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
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(socketMessage))
      } else {
        alert('WebSocket closed or not connected')
      }
    },

    SetChatId(id: number) {
      this.chatId = id
    },
  },
})
