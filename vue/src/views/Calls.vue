<script setup>
import { ChevronLeftIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from '@heroicons/vue/24/outline'
import axios from '@/plugins/axios'
import { onMounted, onUnmounted, ref } from 'vue'
import Loading from '@/components/Loading.vue'
import { useSocketStore } from '@/stores/socket'
import { useCallStore } from '@/stores/call'

const socketStore = useSocketStore()
const callStore = useCallStore()

let userId = localStorage.getItem('userId')
const calls = ref([])
const isLoading = ref(false)

async function getCalls() {
  const response = await axios(`/users/${userId}/calls`)
  calls.value = response.data
}

function FindKey(time) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const date = new Date(time)
  let key = ''

  if (date.toDateString() === now.toDateString()) {
    key = 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    key = 'Yesterday'
  } else {
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 7) {
      key = date.toLocaleDateString('en-US', {
        weekday: 'long',
      })
    } else if (diffDays < 365) {
      key = date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        weekday: 'short',
      })
    } else {
      key = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    }
  }

  return key
}

async function onAddCallToHistory(event) {
  console.log(event.detail)
  calls.value.unshift(event.detail)
}

function findCallTime(time) {
  const date = new Date(time)
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

onMounted(async () => {
  isLoading.value = true
  socketStore.connect()
  window.addEventListener('add-call-to-history', onAddCallToHistory)
  await getCalls()
  isLoading.value = false
})

onUnmounted(() => {
  window.removeEventListener('add-call-to-history', onAddCallToHistory)
})
</script>

<template>
  <main class="flex-1 dark:bg-gray-900">
    <nav class="flex w-full bg-white dark:bg-gray-900 items-center justify-between mx-auto p-4">
      <RouterLink to="/chats" class="flex items-center hover:scale-110">
        <ChevronLeftIcon class="size-6 text-black dark:text-white"
      /></RouterLink>

      <p class="text-2xl font-semibold whitespace-nowrap dark:text-white">Call History</p>

      <button class="w-6"></button>
    </nav>

    <div class="px-2">
      <div
        v-for="call in calls"
        @click="
          callStore.startCall(
            call.caller.id == Number(userId) ? call.callee.id : call.caller.id,
            call.caller.id == Number(userId) ? call.callee.name : call.caller.name,
          )
        "
        class="flex justify-between items-center p-4 border-b hover:bg-gray-100 border-gray-300 dark:border-gray-400 dark:hover:bg-gray-700"
      >
        <p class="font-bold dark:text-white">
          {{ call.caller.id == Number(userId) ? call.callee.name : call.caller.name }}
        </p>
        <div class="flex justify-center items-center gap-2 text-gray-500 dark:text-gray-500">
          <p class="text-xs text-center">
            {{ FindKey(call.callTime) + ' ' + findCallTime(call.callTime) }}
          </p>
          <ArrowDownLeftIcon
            v-if="call.caller.id != Number(userId)"
            class="size-3"
            :class="call.answerType == 2 ? 'text-green-500' : 'text-red-500'"
          />
          <ArrowUpRightIcon
            v-if="call.caller.id == Number(userId)"
            class="size-3"
            :class="call.answerType == 2 ? 'text-green-500' : 'text-red-500'"
          />
        </div>
      </div>
    </div>

    <Loading v-if="isLoading" :is-full-page="true" />
  </main>
</template>
