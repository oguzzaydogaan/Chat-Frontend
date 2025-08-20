<script setup>
import { onMounted, ref } from 'vue'
import { useCallStore } from '@/stores/call'
import { useSocketStore } from '@/stores/socket'
import { PhoneXMarkIcon } from '@heroicons/vue/24/outline'

const socketStore = useSocketStore()
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

onMounted(async () => {
  socketStore.connect()
  if (!callStore.isCalling && !callStore.isIncomingCall && !callStore.isInCall) {
    console.warn('No call state is active.')
  }
})
</script>

<template>
  <main class="min-h-dvh flex justify-center dark:bg-gray-900 dark:text-white">
    <div class="flex flex-col justify-between items-center w-full max-w-sm py-16">
      <div class="flex flex-col items-center gap-4 text-2xl">
        <img
          class="size-32 rounded-full ring-2 ring-gray-300 dark:ring-gray-700"
          src="https://www.gravatar.com/avatar/?d=mp&s=200"
          alt="User Avatar"
        />
        <p v-if="callStore.isCalling">Calling {{ callStore.otherUser.name }}</p>
        <audio
          v-if="callStore.isCalling"
          ref="audio"
          src="/public/sounds/calling.mp3"
          @play="audio.playbackRate = 0.5"
          @ended="loopAudio"
          autoplay
          playsinline
        ></audio>
        <p v-if="callStore.isInCall">In call with {{ callStore.otherUser.name }}</p>
      </div>

      <button
        v-if="callStore.isCalling"
        @click="callStore.cancelCall()"
        class="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white"
      >
        <PhoneXMarkIcon class="size-12" />
      </button>

      <button
        v-if="callStore.isInCall"
        @click="callStore.endCall()"
        class="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white"
      >
        <PhoneXMarkIcon class="size-12" />
      </button>
    </div>
  </main>
</template>
