import { defineStore } from 'pinia'
import { onMounted, ref } from 'vue'
import axios from '@/plugins/axios'
import db from '@/plugins/db'
import { useRoute } from 'vue-router'

export const useChatStore = defineStore('chat', () => {
  const route = useRoute()
  const userId = Number(localStorage.getItem('userId'))
  const chats = ref([])
  const notSeenChatIds = ref([])
  const filteredChats = ref([])
  const searchQuery = ref('')
  const unSentMessagesDb = ref([])
  const unSentMessages = ref([])
  const unSavedMessagesDb = ref([])

  async function getAllChats() {
    const response = await axios(`/users/${userId}/chats`)
    chats.value = response.data
    filteredChats.value = response.data
    chats.value.forEach((chat) => {
      if (chat.count != 0) {
        addId(chat.id)
      }
    })
  }

  async function moveChatToTop(event, type = 0) {
    let chat = null
    switch (type) {
      case 0:
        chat = { id: event.detail.Payload.Chat.Id, name: event.detail.Payload.Chat.Name }
        break
      case 1:
        chat = { id: event.detail.Payload.Message.ChatId, name: null }
        break
      case 2:
        chat = { id: event.detail.Message.ChatId, name: null }
        break
    }

    if (
      !event.detail.Sender.Id == Number(userId) ||
      !(route.name == 'messages' && route.params.cid && Number(route.params.cid) == chat.id)
    ) {
      addId(chat.id)
    }

    const index = chats.value.findIndex((c) => c.id == chat.id)
    if (index != -1) {
      const existingChat = chats.value[index]
      if (existingChat.count != -1) {
        existingChat.count += 1
      }
      if (index != 0) {
        chats.value.splice(index, 1)
        chats.value.splice(0, 0, existingChat)
      }
    } else {
      chats.value.splice(0, 0, {
        id: chat.id,
        name: chat.name,
        count: -1,
      })
    }

    if (searchQuery.value == '') {
      filteredChats.value = chats.value
    }
  }

  function searchChats(query) {
    searchQuery.value = query
    if (query == '') {
      filteredChats.value = chats.value
    } else {
      filteredChats.value = chats.value.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()),
      )
    }
  }

  async function onNewMessage(event) {
    await filterUnSent(event.detail.Message.LocalId)
    await pushUnsaved(event.detail.Message)
    await moveChatToTop(event, 2)
  }

  async function onSaveMessage(event) {
    await filterUnSaved(event.detail.Payload.Message.LocalId)
  }

  async function onDeleteMessage(event) {
    await moveChatToTop(event, 1)
  }

  async function onNewChat(event) {
    await moveChatToTop(event)
  }

  async function onUserJoin(event) {
    await moveChatToTop(event)
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
    chats.value.find((c) => c.id == id).count = 0
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

  async function init() {
    unSentMessagesDb.value = await db.getAllNotSends()
    unSavedMessagesDb.value = await db.getAllUnsaved()
    await getAllChats()
  }

  onMounted(async () => {
    window.addEventListener('new-chat', onNewChat)
    window.addEventListener('user-join', onUserJoin)
    window.addEventListener('save-message', onSaveMessage)
    window.addEventListener('new-message', onNewMessage)
    window.addEventListener('delete-message', onDeleteMessage)
  })

  return {
    chats,
    filteredChats,
    searchQuery,
    notSeenChatIds,
    unSentMessagesDb,
    unSentMessages,
    unSavedMessagesDb,
    init,
    searchChats,
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
