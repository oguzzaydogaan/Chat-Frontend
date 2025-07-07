<script setup>
import { RouterLink, useRoute } from 'vue-router'
import logout from '@/assets/js/logout'

const route = useRoute()
</script>

<template>
  <nav class="flex justify-between py-5 px-4 bg-blue-500 text-white text-2xl">
    <RouterLink :to="`/chats`" class="hover:text-gray-300 transition-all duration-300">
      <i class="bi bi-house"></i>
    </RouterLink>
    <button
      v-if="route.name == 'chats'"
      @click="addChat"
      class="hover:text-gray-300 transition-all duration-300"
    >
      <i class="bi bi-box-arrow-in-left"></i>
    </button>
    <button @click="logout" class="hover:text-gray-300 transition-all duration-300">
      <i class="bi bi-box-arrow-in-left"></i>
    </button>
  </nav>
</template>
