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
        `wss://localhost:7193/ws/message?accessToken=${localStorage.getItem('token')}`,
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
      }
    },

    sendMessage(socketMessage: any) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        if (socketMessage.Type == 'Send-Message') {
          this.socket.send(
            JSON.stringify({
              Type: socketMessage.Type,
              Payload: {
                UserId: socketMessage.Payload.UserId,
                ChatId: socketMessage.Payload.ChatId,
                Content: socketMessage.Payload.Content,
              },
            }),
          )
        } else if (socketMessage.Type == 'Delete-Message') {
          this.socket.send(
            JSON.stringify({
              Type: 'Delete-Message',
              Payload: {
                MessageId: socketMessage.Payload.MessageId,
              },
            }),
          )
        } else if (socketMessage.Type == 'New-Chat') {
          this.socket.send(
            JSON.stringify({
              Type: 'New-Chat',
              Payload: {
                Chat: socketMessage.Payload.Chat,
              },
            }),
          )
        } else if (socketMessage.Type == 'New-UserToChat') {
          this.socket.send(
            JSON.stringify({
              Type: 'New-UserToChat',
              Payload: {
                UserId: socketMessage.Payload.UserId,
                ChatId: socketMessage.Payload.ChatId,
              },
            }),
          )
        }
      } else {
        console.warn('WebSocket açık değil, mesaj gönderilemiyor')
      }
    },

    SetChatId(id: number) {
      this.chatId = id
    },
  },
})
