<script setup lang="ts">
import { initFlowbite } from 'flowbite'
import Dropdown from '@/components/Dropdown.vue'
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
  chats.value.splice(0, 0, { id: event.detail.Id, name: event.detail.Name })
  socket.successToast('New chat')
}
function newUserToChatEvent(event: any) {
  const index = chats.value.findIndex((c: any) => c.id == event.detail.Id)
  if (index != -1) {
    const chat = chats.value[index]
    chats.value.splice(index, 1)
  }
  chats.value.splice(0, 0, { id: event.detail.Id, name: event.detail.Name })
  socket.successToast('New user joined')
}
onMounted(async () => {
  initFlowbite()
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
    <div class="flex items-center justify-center px-4 py-2 bg-white shadow-md">
      <h2 class="text-center text-3xl text-gray-800 font-semibold">Chats</h2>
      <Dropdown />
    </div>
    <RouterLink
      v-for="chat in chats"
      :to="`/messages/${chat.id}`"
      class="block bg-white border-b-1 border-gray-400 p-4 text-gray-600"
    >
      <div class="font-bold">{{ chat.name }}</div>
    </RouterLink>
  </main>
</template>
