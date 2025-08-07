import { defineStore } from 'pinia'
import { onMounted, ref } from 'vue'
import axios from '@/plugins/axios'

export const useChatStore = defineStore('chat', () => {
  const allChats = ref([])
  const userId = Number(localStorage.getItem('userId'))
  const notSeenChatIds = ref([])
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
  onMounted(async () => {
    await getAllChats()
  })
  return { notSeenChatIds, addId, removeId }
})
