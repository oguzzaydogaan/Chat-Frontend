import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useChatsStore = defineStore('chat', () => {
  const chats = ref([{ id: 0, name: '' }])

  return { chats }
})
