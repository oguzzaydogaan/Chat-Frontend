<script setup>
import { useCallStore } from '@/stores/call'
import { PhoneXMarkIcon } from '@heroicons/vue/24/outline'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'

const callStore = useCallStore()
</script>

<template>
  <main
    v-if="callStore.isInCall && callStore.showCallUI"
    class="absolute h-full w-full z-50 flex flex-col items-center bg-white text-black dark:bg-gray-900 dark:text-white"
  >
    <nav class="flex w-full bg-white dark:bg-gray-900 mx-auto p-4">
      <button @click="callStore.changeShowCallUI" class="flex items-center hover:scale-110">
        <ChevronLeftIcon class="size-7 text-black dark:text-white" />
      </button>
    </nav>
    <div class="flex flex-col justify-between items-center w-full max-w-sm h-full">
      <div class="flex flex-col items-center gap-4 text-2xl">
        <img
          class="size-32 rounded-full ring-2 ring-gray-300 dark:ring-gray-700"
          src="https://www.gravatar.com/avatar/?d=mp&s=200"
          alt="User Avatar"
        />
        <div class="text-center">
          <p class="text-3xl font-medium">{{ callStore.otherUser.name }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">In Call</p>
        </div>
      </div>

      <button
        @click="callStore.endCall()"
        class="p-3 rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white mb-[60px]"
      >
        <PhoneXMarkIcon class="size-12" />
      </button>
    </div>
  </main>
  <main v-if="callStore.isInCall && !callStore.showCallUI">
    <button
      @click="callStore.changeShowCallUI"
      class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white flex items-center justify-center w-full"
    >
      In call with {{ callStore.otherUser.name }}
    </button>
  </main>
</template>
