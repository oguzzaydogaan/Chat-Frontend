<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useSocketStore } from '@/stores/socket'
import axios from '@/plugins/axios'

const userId = localStorage.getItem('userId')
const socket = useSocketStore()
const chats = ref<any>([])
async function GetChats() {
  axios(`/users/${userId}/chats`).then(function (response) {
    chats.value = response.data
  })
}
function newMessageEvent(event: any) {
  const index = chats.value.findIndex((c: any) => c.id == event.detail.ChatId)
  if (index != 0 && index != -1) {
    const chat = chats.value[index]
    chats.value.splice(index, 1)
    chats.value.splice(0, 0, chat)
  }
  if (userId != event.detail.Sender.Id) {
    socket.successToast('New message')
  }
}
function deleteMessageEvent(event: any) {
  const index = chats.value.findIndex((c: any) => c.id == event.detail.ChatId)
  if (index != 0 && index != -1) {
    const chat = chats.value[index]
    chats.value.splice(index, 1)
    chats.value.splice(0, 0, chat)
  }
  socket.successToast('Message deleted')
}
function newChatEvent(event: any) {
  let names = [] as String[]
  event.detail.Users.forEach((user: any) => {
    if (user.Id != userId) {
      names.push(user.Name)
    }
  })
  let concatName = names.join(', ')
  chats.value.splice(0, 0, { id: event.detail.Id, name: concatName })
  socket.successToast('New chat')
}
function newUserToChatEvent(event: any) {
  let names = [] as String[]
  event.detail.Users.forEach((user: any) => {
    if (user.Id != userId) {
      names.push(user.Name)
    }
  })
  let concatName = names.join(', ')
  const index = chats.value.findIndex((c: any) => c.id == event.detail.Id)
  if (index != -1) {
    const chat = chats.value[index]
    chats.value.splice(index, 1)
  }
  chats.value.splice(0, 0, { id: event.detail.Id, name: concatName })
  socket.successToast('New user joined')
}
onMounted(async () => {
  await GetChats()
  socket.connect(userId)
  window.addEventListener('new-chat', newChatEvent)
  window.addEventListener('new-usertochat', newUserToChatEvent)
  window.addEventListener('new-message', newMessageEvent)
  window.addEventListener('delete-message', deleteMessageEvent)
})

onUnmounted(() => {
  window.removeEventListener('new-chat', newChatEvent)
  window.removeEventListener('new-usertochat', newUserToChatEvent)
  window.removeEventListener('new-message', newMessageEvent)
  window.removeEventListener('delete-message', deleteMessageEvent)
})

function addChat(socketMessage: any) {
  socket.sendMessage(socketMessage)
}
</script>

<template>
  <main>
    <Navbar @add-chat="addChat" />
    <h2 class="text-center text-3xl text-gray-800 my-2 font-semibold">Chats</h2>
    <RouterLink
      v-for="chat in chats"
      :to="`/messages/${chat.id}`"
      class="block bg-white border-b-1 border-gray-400 p-4 text-gray-600"
    >
      <div class="font-bold">{{ chat.name }}</div>
    </RouterLink>
  </main>
</template>
