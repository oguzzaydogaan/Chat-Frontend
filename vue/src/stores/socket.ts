import { defineStore } from 'pinia'

type Message = {
  Id: number
  Sender: { Id: string; Name: string }
  ChatId: number
  Content: string
  IsDeleted: boolean
}

export const useSocketStore = defineStore('socket', {
  state: () => ({
    name: '',
    socket: null as WebSocket | null,
    isConnected: false,
    chatId: 0,
  }),
  actions: {
    connect(userId: any) {
      if (this.socket && this.isConnected) return

      this.socket = new WebSocket(
        `wss://localhost:7193/ws/message?userId=${userId}&accessToken=${localStorage.getItem('token')}`,
      )

      this.socket.onopen = () => {
        console.log('WebSocket bağlantısı kuruldu')
        this.isConnected = true
      }

      this.socket.onmessage = async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.Type === 'Send-Message') {
            window.dispatchEvent(new CustomEvent('new-message', { detail: data.Payload }))
          } else if (data.Type == 'Delete-Message') {
            window.dispatchEvent(new CustomEvent('delete-message', { detail: data.Payload.Id }))
          }
        } catch (err) {
          console.error('WebSocket mesajı çözümlenemedi:', err)
        }
      }

      this.socket.onclose = () => {
        this.socket = null
        console.log('WebSocket bağlantısı kapandı')
        this.isConnected = false
      }

      this.socket.onerror = (event: Event) => {
        console.error('WebSocket hatası:', event)
      }
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
        } else {
          this.socket.send(
            JSON.stringify({
              Type: 'Delete-Message',
              Payload: {
                MessageId: socketMessage.Payload.MessageId,
              },
            }),
          )
        }
      } else {
        console.warn('WebSocket açık değil, mesaj gönderilemiyor')
      }
    },

    SetName(setter: any) {
      this.name = setter
    },

    SetChatId(id: number) {
      this.chatId = id
    },
  },
})
