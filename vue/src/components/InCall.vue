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
    <nav class="flex w-full pt-2 px-2">
      <button @click="callStore.changeShowCallUI" class="flex items-center hover:scale-110">
        <ChevronLeftIcon class="size-7 text-black dark:text-white" />
      </button>
    </nav>
    <div class="flex flex-col flex-1 justify-between gap-2 p-2 items-center w-full overflow-y-auto">
      <div
        v-if="callStore.participants.size > 0"
        class="flex-1 flex flex-wrap gap-4 text-2xl w-full overflow-y-auto"
      >
        <div
          v-for="key in callStore.participants.keys()"
          class="flex flex-1 min-h-[150px] min-w-full sm:min-w-[300px] 940:min-w-[400px] text-center items-center justify-center text-gray-500 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-lg"
        >
          <p>{{ callStore.participants.get(key) }}</p>
        </div>
      </div>
      <div v-if="callStore.participants.size == 0" class="flex flex-1 justify-center items-center">
        <p class="text-red-500">Waiting for others...</p>
      </div>

      <div class="flex gap-4">
        <button
          id="change-button"
          data-dropdown-toggle="change-dropdown"
          data-dropdown-placement="top"
          type="button"
          class="size-16 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex justify-center items-center"
        >
          <EllipsisVerticalIcon class="size-11 text-gray-500 dark:text-gray-200" />
        </button>

        <button
          @click="async () => await callStore.endCall()"
          class="rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white flex justify-center items-center px-4"
        >
          <div class="flex justify-center items-center gap-1">
            <PhoneXMarkIcon class="size-8" />
            <p class="text-sm text-white text-center h-fit">
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
        <div
          id="change-dropdown"
          class="z-10 hidden bg-white rounded-lg shadow-sm w-44 dark:bg-gray-700"
        >
          <ul
            class="text-sm text-gray-700 dark:text-gray-200 divide-y divide-gray-300 dark:divide-gray-500"
            aria-labelledby="change-button"
          >
            <li>
              <button
                id="change-mic-button"
                data-dropdown-toggle="change-mic-dropdown"
                data-dropdown-placement="top"
                type="button"
                class="text-center font-bold w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                Select Microphone
              </button>
            </li>
            <li>
              <button
                id="change-speaker-button"
                data-dropdown-toggle="change-speaker-dropdown"
                data-dropdown-placement="top"
                type="button"
                class="text-center font-bold w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                Select Speaker
              </button>
            </li>
          </ul>

          <div
            id="change-mic-dropdown"
            class="z-10 hidden bg-white rounded-lg shadow-sm w-44 dark:bg-gray-700 divide-y divide-gray-300 dark:divide-gray-200"
          >
            <ul
              class="text-sm text-gray-700 dark:text-gray-200 divide-y divide-gray-300 dark:divide-gray-500"
              aria-labelledby="change-mic-button"
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
          <div
            id="change-speaker-dropdown"
            class="z-10 hidden bg-white rounded-lg shadow-sm w-44 dark:bg-gray-700 divide-y divide-gray-300 dark:divide-gray-200"
          >
            <ul
              class="text-sm text-gray-700 dark:text-gray-200 divide-y divide-gray-300 dark:divide-gray-500"
              aria-labelledby="change-speaker-button"
            >
              <li v-for="speaker in callStore.speakers">
                <button
                  @click="callStore.setOutput(speaker.deviceId)"
                  class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  {{ speaker.label }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
