import { defineStore } from 'pinia'
import Swal from 'sweetalert2'

type Message = {
  Id: number
  Sender: { Id: string; Name: string }
  ChatId: number
  Content: string
  IsDeleted: boolean
}

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null as WebSocket | null,
    isConnected: false,
    chatId: 0,
  }),
  actions: {
    connect(userId: any) {
      if (this.socket && this.isConnected) return

      this.socket = new WebSocket(
        `wss://${import.meta.env.VITE_BACKEND_URL}/ws/message?accessToken=${localStorage.getItem('token')}`,
      )

      this.socket.onopen = () => {
        console.log('WebSocket bağlantısı kuruldu')
        this.isConnected = true
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
            window.dispatchEvent(new CustomEvent('new-usertochat', { detail: data.Payload.Chat }))
          } else if (data.Type == 'Error') {
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer
                toast.onmouseleave = Swal.resumeTimer
              },
            })
            Toast.fire({
              icon: 'error',
              title: data.Payload.Error,
            })
          }
        } catch (err) {
          console.error('WebSocket mesajı çözümlenemedi:', err)
        }
      }

      this.socket.onclose = (event) => {
        this.socket = null
        console.log(event.reason)
        this.isConnected = false
      }

      this.socket.onerror = (event: Event) => {
        console.error('WebSocket hatası:', event)
      }
    },

    successToast(message: string) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer
          toast.onmouseleave = Swal.resumeTimer
        },
      })
      Toast.fire({
        icon: 'success',
        title: message,
      })
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
