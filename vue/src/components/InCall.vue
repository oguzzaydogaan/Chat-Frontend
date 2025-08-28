<script setup>
import { useCallStore } from '@/stores/call'
import { PhoneXMarkIcon } from '@heroicons/vue/24/outline'
import { ChevronLeftIcon, MicrophoneIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import { initDropdowns } from 'flowbite'
import { onMounted } from 'vue'

const callStore = useCallStore()
onMounted(() => initDropdowns())
</script>

<template>
  <main
    class="absolute h-full w-full z-50 flex flex-col items-center bg-white text-black dark:bg-gray-900 dark:text-white overflow-y-auto"
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
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <span v-if="callStore.callHours > 0">{{
              callStore.callHours.toString().padStart(2, '0') + ':'
            }}</span
            >{{
              callStore.callMinutes.toString().padStart(2, '0') +
              ':' +
              callStore.callSeconds.toString().padStart(2, '0')
            }}
          </p>
        </div>
      </div>

      <div class="flex gap-4 mb-[100px]">
        <button
          id="dropdownDefaultButton"
          data-dropdown-toggle="dropdown"
          type="button"
          class="size-16 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-white flex justify-center items-center"
        >
          <EllipsisVerticalIcon class="size-11 text-gray-500 dark:text-gray-200" />
        </button>
        <button
          @click="callStore.endCall()"
          class="size-16 rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white flex justify-center items-center"
        >
          <PhoneXMarkIcon class="size-8" />
        </button>
        <button
          @click="callStore.toggleMic()"
          class="size-16 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex justify-center items-center"
        >
          <MicrophoneIcon
            class="size-9"
            :class="
              callStore.isMute
                ? 'text-red-500 dark:text-red-600'
                : 'text-gray-500 dark:text-gray-200'
            "
          />
        </button>

        <!-- Dropdown menu -->
        <div id="dropdown" class="z-10 hidden bg-white rounded-lg shadow-sm w-44 dark:bg-gray-700">
          <ul
            class="text-sm text-gray-700 dark:text-gray-200 divide-y divide-gray-300 dark:divide-gray-500"
            aria-labelledby="dropdownDefaultButton"
          >
            <li v-for="mic in callStore.microphones">
              <button
                @click="callStore.setMicrophone(mic.deviceId)"
                class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                {{ mic.label }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </main>
</template>
