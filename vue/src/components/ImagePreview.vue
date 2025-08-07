<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
const props = defineProps(['img'])
</script>

<template>
  <main class="absolute h-full w-full z-50">
    <div class="flex flex-col h-full">
      <nav class="absolute top-2 right-2 z-50">
        <button @click="$emit('close')" class="hover:scale-110 cursor-pointer">
          <XMarkIcon class="dark:text-white size-6" />
        </button>
      </nav>
      <div class="relative grow items-center justify-center bg-gray-100/95 dark:bg-gray-800/95">
        <img :src="props.img" class="h-full w-full object-contain absolute" />
      </div>
    </div>
  </main>
</template>
