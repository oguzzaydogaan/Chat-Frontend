<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { onMounted, ref } from 'vue'
const route = useRoute()
const chats = ref([{ id: 0, name: '' }])
async function GetChats() {
  const response = await fetch('https://localhost:7193/api/users/' + route.params.uid)
  const data = await response.json()
  chats.value = data
  console.log(chats.value)
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
      v-for="chat in chats"
      :to="`/${route.params.uid}/chats-${chat.id}/messages`"
      class="block bg-white border-b-1 border-gray-400 p-4 text-gray-600"
    >
      <div class="font-bold">{{ chat.name }}</div>
    </RouterLink>
  </main>
</template>
