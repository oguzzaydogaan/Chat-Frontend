<script setup>
import { useCallStore } from '@/stores/call'

const callStore = useCallStore()
</script>

<template>
  <main>
    <button
      @click="callStore.changeShowCallUI"
      class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white flex items-center justify-center w-full"
    >
      In call {{ callStore.callName }} -&nbsp;
      <span v-if="callStore.callHours > 0" class="text-gray-200 text-xs">{{
        callStore.callHours.toString().padStart(2, '0') + ':'
      }}</span>
      <span class="text-gray-200 text-xs">
        {{
          callStore.callMinutes.toString().padStart(2, '0') +
          ':' +
          callStore.callSeconds.toString().padStart(2, '0')
        }}</span
      >
    </button>
  </main>
</template>
