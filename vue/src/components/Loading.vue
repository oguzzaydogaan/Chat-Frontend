<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/css/index.css'

const props = defineProps(['is-full-page'])
const bg = ref('')
onMounted(() => {
  bg.value = document.documentElement.classList.contains('dark') ? '#111827' : '#FFF'
})
onUnmounted(() => {
  bg.value = ''
})
</script>

<template>
  <main>
    <Loading
      :active="true"
      :opacity="1"
      :is-full-page="props.isFullPage"
      :can-cancel="false"
      :background-color="bg"
      :z-index="50"
      loader="dots"
      :lock-scroll="true"
      color="#10B981"
    />
  </main>
</template>
