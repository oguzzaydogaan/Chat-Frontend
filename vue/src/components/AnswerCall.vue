<script setup>
import { useCallStore } from '@/stores/call'
import { PhoneIcon, PhoneXMarkIcon } from '@heroicons/vue/24/outline'

const callStore = useCallStore()
</script>

<template>
  <main
    v-if="callStore.isIncomingCall"
    class="absolute h-full w-full z-50 bg-white dark:bg-gray-900"
  >
    <audio src="/sounds/incoming-call.mp3" loop autoplay playsinline="true"></audio>
    <div class="flex items-center justify-center h-full py-16">
      <div class="flex flex-col h-full w-full max-w-sm items-center justify-between gap-4 p-4">
        <img
          class="size-32 rounded-full ring-2 ring-gray-300 dark:ring-gray-700"
          src="https://www.gravatar.com/avatar/?d=mp&s=200"
          alt="User Avatar"
        />
        <div class="flex flex-col grow items-center justify-between">
          <p class="text-black dark:text-white text-2xl">{{ callStore.otherUser.name }}</p>
          <div class="flex gap-24 justify-center items-center">
            <button
              @click="callStore.sendAnswer(false)"
              class="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneXMarkIcon class="size-12" />
            </button>
            <button
              @click="callStore.sendAnswer(true)"
              class="p-3 rounded-full bg-green-500 hover:bg-green-600 text-white"
            >
              <PhoneIcon class="size-12" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
