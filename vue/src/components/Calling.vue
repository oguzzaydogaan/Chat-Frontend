<script setup>
import { ref } from 'vue'
import { useCallStore } from '@/stores/call'
import { PhoneXMarkIcon } from '@heroicons/vue/24/outline'

const callStore = useCallStore()
const audio = ref(null)

function loopAudio() {
  setTimeout(() => {
    if (audio.value) {
      audio.value.currentTime = 0
      audio.value.play()
    }
  }, 2500)
}
</script>

<template>
  <main
    class="absolute h-full w-full z-50 flex justify-center bg-white dark:bg-gray-900 dark:text-white overflow-y-auto"
  >
    <div class="flex flex-col flex-1 justify-between items-center gap-2 max-w-sm py-[6dvh]">
      <audio
        ref="audio"
        src="/sounds/calling.mp3"
        @play="audio.playbackRate = 0.5"
        @ended="loopAudio"
        autoplay
        playsinline
      ></audio>
      <div class="flex flex-col items-center gap-4">
        <img
          class="size-32 rounded-full ring-2 ring-gray-300 dark:ring-gray-700"
          src="https://www.gravatar.com/avatar/?d=mp&s=200"
          alt="User Avatar"
        />
        <div class="text-center">
          <p class="text-3xl text-medium">a</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Calling</p>
        </div>
      </div>

      <button
        @click="callStore.cancelCall()"
        class="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white"
      >
        <PhoneXMarkIcon class="size-12" />
      </button>
    </div>
  </main>
</template>
