import { defineStore } from 'pinia'
import { onMounted, ref } from 'vue'
import axios from '@/plugins/axios'
import db from '@/plugins/db'

export const useChatStore = defineStore('chat', () => {
  const allChats = ref([])
  const userId = Number(localStorage.getItem('userId'))
  const notSeenChatIds = ref([])
  const unSentMessagesDb = ref([])
  const unSentMessages = ref([])
  const unSavedMessagesDb = ref([])

  async function getAllChats() {
    const response = await axios(`/users/${userId}/chats`)
    allChats.value = response.data
    allChats.value.forEach((chat) => {
      if (chat.count != 0) {
        addId(chat.id)
      }
    })
  }

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

  async function pushUnSent(socketMessage) {
    unSentMessages.value.push(socketMessage)
    unSentMessagesDb.value.push(socketMessage)
    await db.saveNotSend(socketMessage)
  }

  async function filterUnSent(id) {
    unSentMessages.value = unSentMessages.value.filter((s) => s.Payload.Message.LocalId == id)
    unSentMessagesDb.value = unSentMessagesDb.value.filter((s) => s.Payload.Message.LocalId != id)
    await db.deleteNotSend(id)
  }

  async function pushUnsaved(message) {
    unSavedMessagesDb.value.push(message)
    await db.saveUnsaved(message)
  }

  async function filterUnSaved(id) {
    unSavedMessagesDb.value = unSavedMessagesDb.value.filter((m) => m.LocalId != id)
    await db.deleteUnsaved(id)
  }

  function isContainUnSent(id) {
    return unSentMessages.value.some((s) => s.Payload.Message.LocalId == id)
  }

  function isContainUnSentDb(id) {
    return unSentMessagesDb.value.some((s) => s.Payload.Message.LocalId == id)
  }

  onMounted(async () => {
    unSentMessagesDb.value = await db.getAllNotSends()
    unSavedMessagesDb.value = await db.getAllUnsaved()
    await getAllChats()
  })

  return {
    allChats,
    notSeenChatIds,
    unSentMessagesDb,
    unSentMessages,
    unSavedMessagesDb,
    addId,
    removeId,
    pushUnSent,
    filterUnSent,
    pushUnsaved,
    filterUnSaved,
    isContainUnSent,
    isContainUnSentDb,
  }
})
