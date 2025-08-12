import { defineStore } from 'pinia'
import { onMounted, ref } from 'vue'
import axios from '@/plugins/axios'

export const useChatStore = defineStore('chat', () => {
  const allChats = ref([])
  const userId = Number(localStorage.getItem('userId'))
  const notSeenChatIds = ref([])
  const unSentMessages = ref([])
  function addId(id) {
    if (!notSeenChatIds.value.some((i) => i == id)) {
      notSeenChatIds.value.push(id)
      if (notSeenChatIds.value.length != 0) {
        document.title = `(${notSeenChatIds.value.length}) Chat App`
      }
    }
  }
  function removeId(id) {
    notSeenChatIds.value = notSeenChatIds.value.filter((i) => i != id)
    if (notSeenChatIds.value.length != 0) {
      document.title = `(${notSeenChatIds.value.length}) Chat App`
    } else {
      document.title = 'Chat App'
    }
  }
  async function getAllChats() {
    const response = await axios(`/users/${userId}/chats`)
    allChats.value = response.data
    allChats.value.forEach((chat) => {
      if (chat.count != 0) {
        addId(chat.id)
      }
    })
  }
  function pushUnSent(socketMessage) {
    unSentMessages.value.push(socketMessage)
  }
  function filterUnSent(id) {
    unSentMessages.value.filter((s) => s.Payload.Message.LocalId == id)
  }
  function isContainUnSent(id) {
    return unSentMessages.value.some((s) => s.Payload.Message.LocalId == id)
  }
  onMounted(async () => {
    await getAllChats()
  })
  return {
    notSeenChatIds,
    unSentMessages,
    addId,
    removeId,
    pushUnSent,
    filterUnSent,
    isContainUnSent,
  }
})
