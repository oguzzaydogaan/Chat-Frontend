<script setup>
import { RouterLink, useRoute } from 'vue-router'
import logout from '@/assets/js/logout'
import wsSender from '@/assets/js/wsSender'
import { defineEmits } from 'vue'

const route = useRoute()

const emit = defineEmits(['addChat', 'addUserToChat'])

const addChat = (message) => {
  emit('addChat', message)
}
const addUserToChat = (message) => {
  emit('addUserToChat', message)
}
</script>

<template>
  <nav class="flex justify-between py-5 px-4 bg-blue-500 text-white text-2xl">
    <RouterLink :to="`/chats`" class="hover:text-gray-300 transition-all duration-300">
      <i class="bi bi-house"></i>
    </RouterLink>
    <button
      v-if="route.name == 'chats'"
      @click="
        wsSender({
          Type: 'New-Chat',
          Payload: {
            Chat: {
              UserIds: [],
              Name: '',
            },
          },
        })
      "
      class="hover:text-gray-300 transition-all duration-300"
    >
      <i class="bi bi-file-earmark-plus"></i>
    </button>
    <button
      v-if="route.name == 'messages'"
      @click="
        wsSender({
          Type: 'New-UserToChat',
          Payload: {
            UserId: 0,
            ChatId: Number(route.params.cid),
          },
        })
      "
      class="hover:text-gray-300 transition-all duration-300"
    >
      <i class="bi bi-person-plus"></i>
    </button>
    <button @click="logout" class="hover:text-gray-300 transition-all duration-300">
      <i class="bi bi-box-arrow-in-left"></i>
    </button>
  </nav>
</template>
