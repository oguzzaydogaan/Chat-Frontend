<script setup>
import { useCallStore } from '@/stores/call'
import { PhoneIcon, PhoneXMarkIcon } from '@heroicons/vue/24/outline'

const callStore = useCallStore()
</script>

<template>
  <main
    v-if="callStore.isIncomingCall"
    class="absolute h-full w-full z-50 flex flex-col items-center bg-white text-black dark:bg-gray-900 dark:text-white"
  >
    <audio src="/sounds/incoming-call.mp3" loop autoplay playsinline="true"></audio>
    <div class="flex flex-col justify-between items-center w-full max-w-sm h-full py-16">
      <div class="flex flex-col items-center gap-4 text-2xl">
        <img
          class="size-32 rounded-full ring-2 ring-gray-300 dark:ring-gray-700"
          src="https://www.gravatar.com/avatar/?d=mp&s=200"
          alt="User Avatar"
        />
        <div class="text-center">
          <p class="text-3xl font-medium">{{ callStore.otherUser.name }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Incoming Call</p>
        </div>
      </div>

      <div class="flex gap-24 justify-center items-center">
        <button
          @click="callStore.sendAnswer(false)"
          class="p-3 rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
        >
          <PhoneXMarkIcon class="size-12" />
        </button>
        <button
          @click="callStore.sendAnswer(true)"
          class="p-3 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white"
        >
          <PhoneIcon class="size-12" />
        </button>
      </div>
    </div>
  </main>
</template>
