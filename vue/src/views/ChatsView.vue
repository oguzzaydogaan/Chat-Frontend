<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { onMounted, ref } from 'vue'
import checkAuthorization from '@/assets/js/checkAuthorization'
import { useChatsStore } from '@/stores/chats'

const route = useRoute()
const store = ref(useChatsStore())
const chats = ref([{ id: 0, name: '' }])
async function GetChats() {
  checkAuthorization()
  const token = localStorage.getItem('token')
  const response = await fetch('https://localhost:7193/api/users/' + route.params.uid + '/chats', {
    headers: {
      Authorization: 'Bearer ' + token!,
    },
  })
  const data = await response.json()
  store.value.chats = data
}
onMounted(async () => {
  await GetChats()
})
</script>

<template>
  <main>
    <Navbar />
    <h2 class="text-center text-3xl text-gray-800 my-2 font-semibold">Chats</h2>
    <RouterLink
      v-for="chat in store.chats"
      :to="`/${route.params.uid}/chats-${chat.id}/messages`"
      class="block bg-white border-b-1 border-gray-400 p-4 text-gray-600"
    >
      <div class="font-bold">{{ chat.name }}</div>
    </RouterLink>
  </main>
</template>
