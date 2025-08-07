<script setup>
import { ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid'
import { RouterLink, useRoute } from 'vue-router'
import { onMounted, ref, onUnmounted } from 'vue'
import { useSocketStore } from '@/stores/socket'
import axios from '@/plugins/axios'

const route = useRoute()
const userId = localStorage.getItem('userId')
const socket = useSocketStore()
const users = ref([])
const searchQuery = ref('')
socket.SetChatId(Number(route.params.cid))
const name = ref('')
const isLoading = ref(false)
const fullScreen = ref(true)

async function GetChat() {
  const response = await axios(`/chats/${route.params.cid}/users/${userId}`)
  name.value = response.data.Name
  users.value = response.data.Users
}

async function Search(query) {
  fullScreen.value = false
  isLoading.value = true
  if (!query) {
    await GetChat()
    isLoading.value = false
    return
  }
  query = query.toLowerCase()
  isLoading.value = true
  const response = await axios(`/chats/${route.params.cid}/users/search?searchTerm=${query}`)
  users.value = response.data
  isLoading.value = false
}

async function onUserJoin(event) {
  if (event.detail.Payload.Chat.Id != Number(route.params.cid)) {
    return
  }
  if (!searchQuery.value) {
    users.value = event.detail.Payload.Chat.Users
  } else {
    users.value = event.detail.Payload.Chat.Users.filter((u) =>
      u.Name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }
}

onMounted(async () => {
  fullScreen.value = true
  isLoading.value = true
  await GetChat()
  socket.connect()
  window.addEventListener('user-join', onUserJoin)
  isLoading.value = false
  isLoading.value = false
})

onUnmounted(() => {
  window.removeEventListener('user-join', onUserJoin)
})
</script>

<template>
  <main class="min-h-dvh dark:bg-gray-900">
    <nav class="flex w-full bg-white dark:bg-gray-900 items-center justify-between mx-auto p-4">
      <RouterLink :to="`/messages/${route.params.cid}`" class="flex items-center hover:scale-110">
        <ChevronLeftIcon class="size-6 text-black dark:text-white"
      /></RouterLink>

      <p class="text-2xl font-semibold whitespace-nowrap dark:text-white">
        {{ name }}
      </p>

      <div class="w-[24px]"></div>
    </nav>

    <div class="flex items-center mx-auto px-4 py-2">
      <div class="relative w-full">
        <div class="absolute inset-y-0 start-0 flex items-center ps-2 pointer-events-none">
          <MagnifyingGlassIcon class="text-gray-500 size-5" />
        </div>
        <input
          @input="Search(searchQuery)"
          v-model="searchQuery"
          name="search"
          autocomplete="off"
          type="search"
          id="simple-search"
          class="bg-gray-200 border-0 text-gray-900 text-sm rounded-lg focus:ring-green-500 block w-full ps-8 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
          placeholder="Search a user..."
          :disabled="users.length < 1 && searchQuery.length < 1"
        />
      </div>
    </div>

    <div class="relative min-h-[56.67px] px-4">
      <Loading v-if="isLoading" :is-full-page="fullScreen" />
      <p
        v-for="user in users"
        class="block font-bold border-b hover:bg-green-100 border-gray-300 dark:border-gray-400 dark:text-white p-4 dark:hover:bg-gray-700"
      >
        {{ user.Name }}
      </p>
      <div v-if="users.length < 1 && isLoading == false" class="text-center text-gray-500 p-4">
        No users found.
      </div>
    </div>
  </main>
</template>
