<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { onMounted, ref } from 'vue'
import checkAuthorization from '@/assets/js/checkAuthorization'
import { useSocketStore } from '@/stores/socket'

const userId = localStorage.getItem('userId')
const socket = useSocketStore()
const chats = ref<any>([])
async function GetChats() {
  checkAuthorization()
  const token = localStorage.getItem('token')
  const response = await fetch('https://localhost:7193/api/users/' + userId + '/chats', {
    headers: {
      Authorization: 'Bearer ' + token!,
    },
  })
  const data = await response.json()
  chats.value = data
}
function newMessageEvent(event: any) {
  const index = chats.value.findIndex((c: any) => c.id == event.detail.ChatId)
  if (index != 0 && index != -1) {
    const chat = chats.value[index]
    chats.value.splice(index, 1)
    chats.value.splice(0, 0, chat)
  }
}
function deleteMessageEvent(event: any) {
  const index = chats.value.findIndex((c: any) => c.id == event.detail.ChatId)
  if (index != 0 && index != -1) {
    const chat = chats.value[index]
    chats.value.splice(index, 1)
    chats.value.splice(0, 0, chat)
  }
}
onMounted(async () => {
  await GetChats()
  socket.connect(userId)
  window.addEventListener('new-message', newMessageEvent)
  window.addEventListener('delete-message', deleteMessageEvent)
})
</script>

<template>
  <main>
    <Navbar />
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
