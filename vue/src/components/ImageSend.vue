<script setup>
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'

const props = defineProps(['img', 'msg'])
const imageMessage = ref(props.msg)
</script>

<template>
  <main class="absolute h-full w-full top-0 z-50">
    <div class="flex flex-col h-full justify-between">
      <nav class="flex justify-end w-full bg-white dark:bg-gray-900 p-4 gap-x-4">
        <button @click="$emit('close')" class="hover:scale-110 cursor-pointer">
          <XMarkIcon class="dark:text-white size-6" />
        </button>
      </nav>
      <div class="relative grow items-center justify-center bg-gray-100 dark:bg-gray-800">
        <img :src="props.img" class="h-full w-full object-contain absolute" />
      </div>

      <form
        @submit.prevent="$emit('send-image', imageMessage, props.img)"
        class="flex justify-between items-center p-3 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-0"
      >
        <input
          name="message"
          v-model="imageMessage"
          class="text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 me-1.5 grow bg-gray-200 dark:bg-gray-700 rounded-full p-2 px-3 focus:ring-green-500 border-0 placeholder:truncate"
          type="text"
          placeholder="Type your message here..."
        />

        <button
          type="submit"
          class="flex justify-center items-center bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white rounded-full w-[40px] h-[40px] cursor-pointer"
        >
          <PaperAirplaneIcon class="size-6" />
        </button>
      </form>
    </div>
  </main>
</template>
