<script setup>
import { RouterLink, useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <nav class="flex justify-between py-5 px-4 bg-blue-500 text-white text-2xl">
    <RouterLink
      :to="`/${route.params.uid}/chats`"
      class="hover:text-gray-300 transition-all duration-300"
    >
      <i class="bi bi-house"></i>
    </RouterLink>
    <RouterLink to="/" class="hover:text-gray-300 transition-all duration-300">
      <i class="bi bi-box-arrow-in-left"></i>
    </RouterLink>
  </nav>
</template>
