<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { initModals } from 'flowbite'
import { onMounted, ref, onUnmounted, nextTick } from 'vue'
import { useSocketStore } from '@/stores/socket'
import axios from '@/plugins/axios'
import Multiselect from 'vue-multiselect'

const route = useRoute()
const userId = localStorage.getItem('userId')
const userName = localStorage.getItem('name')
const socket = useSocketStore()
const scrollHere = ref()
const files = ref()
const messages = ref()
const messagesWithDates = ref({})
const notSeenMessageIds = ref([])
const users = ref([])
socket.SetChatId(Number(route.params.cid))
const newMessage = ref()
const name = ref('')
const multiselectSelected = ref([])
const multiselectOptions = ref([])
const isLoading = ref(false)
var timeOutId = 0

async function GetChat() {
  const response = await axios(`/chats/${route.params.cid}/users/${userId}`)
  name.value = response.data.Name
  messages.value = response.data.Messages
  users.value = response.data.Users

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  messages.value.forEach((message) => {
    if (!message.Seens.some((seen) => seen.UserId == Number(userId))) {
      notSeenMessageIds.value.push(message.Id)
    }

    const date = new Date(message.Time)
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

    if (!messagesWithDates.value[key]) {
      messagesWithDates.value[key] = []
    }
    messagesWithDates.value[key].push(message)
  })
  await nextTick()
  scrollHere.value.scrollIntoView({ behavior: 'smooth' })
}

async function onSeen(event) {
  event.detail.forEach((mr) => {
    Object.keys(messagesWithDates.value).forEach((dateKey) => {
      messagesWithDates.value[dateKey].forEach((message) => {
        if (message.Id === mr.MessageId) {
          message.Seens.push(mr)
        }
      })
    })
  })
  console.log('hello')
}
async function onNewMessage(event) {
  if (event.detail.ChatId == Number(route.params.cid)) {
    if (!messagesWithDates.value['Today']) {
      messagesWithDates.value['Today'] = []
    }
    messagesWithDates.value['Today'].push(event.detail)
    if (event.detail.Sender.Id != Number(userId)) {
      const socketMessage = {
        Type: 'seen',
        Payload: {
          Ids: [event.detail.Id],
          ChatId: event.detail.ChatId,
        },
        Sender: { Id: Number(userId), Name: userName },
      }
      socket.sendMessage(socketMessage)
    }
  }
}
async function onDeleteMessage(event) {
  if (event.detail.ChatId == Number(route.params.cid)) {
    let key = document
      .getElementById(event.detail.Id)
      .parentElement.parentElement.getAttribute('customname')
    const idx = messagesWithDates.value[key].findIndex((m) => m.Id == event.detail.Id)
    messagesWithDates.value[key][idx] = event.detail
    if (event.detail.Sender.Id != Number(userId)) {
      const socketMessage = {
        Type: 'seen',
        Payload: {
          Ids: [event.detail.Id],
          ChatId: event.detail.ChatId,
        },
        Sender: { Id: Number(userId), Name: userName },
      }
      socket.sendMessage(socketMessage)
    }
  }
}
async function onUserJoin(event) {
  if (event.detail.Payload.Chat.Id != Number(route.params.cid)) {
    return
  }
  if (!messagesWithDates.value['Today']) {
    messagesWithDates.value['Today'] = []
  }
  messagesWithDates.value['Today'].push(event.detail.Payload.Message)
  users.value = event.detail.Payload.Chat.Users
  if (event.detail.Sender.Id != Number(userId)) {
    const socketMessage = {
      Type: 'seen',
      Payload: {
        Ids: [event.detail.Payload.Message.Id],
        ChatId: event.detail.Payload.Message.ChatId,
      },
      Sender: { Id: Number(userId), Name: userName },
    }
    socket.sendMessage(socketMessage)
  }
}

async function multiselectGetUsers() {
  var allUsers = await axios.get('/users')
  allUsers.data = allUsers.data.filter(
    (user) => user.id != userId && !users.value.some((u) => u.Id == user.id),
  )
  multiselectOptions.value = allUsers.data.map((user) => ({
    id: user.id,
    name: user.name,
  }))
  multiselectSelected.value = []
}

async function addUser() {
  const selectedUser = multiselectSelected.value.id
  if (selectedUser) {
    const socketMessage = {
      Type: 'User-Join',
      Payload: {
        UserId: Number(selectedUser),
        ChatId: Number(route.params.cid),
      },
      Sender: { Id: Number(userId), Name: userName },
    }
    socket.sendMessage(socketMessage)
  }
}

function removeFocus() {
  document.activeElement.blur()
}

async function fileChange(event) {
  files.value = event.target.files[0]
}
async function fileToBytes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const arrayBuffer = reader.result
      const byteArray = new Uint8Array(arrayBuffer)
      resolve(byteArray)
    }

    reader.onerror = reject

    reader.readAsArrayBuffer(file)
  })
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

async function sendMessage() {
  if ((!newMessage.value || !newMessage.value.trim()) && !files.value) {
    newMessage.value = ''
    return
  }
  let base64Image = null
  if (files.value) {
    const bytes = await fileToBytes(files.value)
    base64Image = bytesToBase64(bytes)
  }
  const socketMessage = {
    Type: 'Send-Message',
    Payload: {
      UserId: Number(userId),
      ChatId: Number(route.params.cid),
      Content: newMessage.value,
      ImageString: base64Image ?? '',
    },
  }
  socket.sendMessage(socketMessage)
  newMessage.value = ''
  files.value = null
}

async function deleteMessage(id) {
  const div = document.getElementById('mbox-' + id)
  div.classList.remove('bg-green-500')
  div.classList.add('bg-green-600')
  timeOutId = setTimeout(async () => {
    const socketMessage = {
      Type: 'Delete-Message',
      Payload: {
        MessageId: id,
      },
      Sender: { Id: Number(userId), Name: userName },
    }
    socket.sendMessage(socketMessage)
  }, 1000)
}
async function deleteCancel(id) {
  clearTimeout(timeOutId)
  const div = document.getElementById('mbox-' + id)
  div.classList.remove('bg-green-600')
  div.classList.add('bg-green-500')
}

function messageTime(time) {
  const date = new Date(time)
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

onMounted(async () => {
  isLoading.value = true
  await GetChat()
  socket.connect()
  window.addEventListener('new-message', onNewMessage)
  window.addEventListener('new-seen', onSeen)
  window.addEventListener('user-join', onUserJoin)
  window.addEventListener('delete-message', onDeleteMessage)
  if (notSeenMessageIds.value.length > 0) {
    const socketMessage = {
      Type: 'seen',
      Payload: {
        Ids: notSeenMessageIds.value,
        ChatId: Number(route.params.cid),
      },
      Sender: { Id: Number(userId), Name: userName },
    }
    socket.sendMessage(socketMessage)
  }

  initModals()
  isLoading.value = false
})

onUnmounted(() => {
  window.removeEventListener('user-join', onUserJoin)
  window.removeEventListener('new-message', onNewMessage)
  window.removeEventListener('delete-message', onDeleteMessage)
})
</script>

<template>
  <main class="h-screen flex flex-col justify-between">
    <nav class="flex w-full bg-white items-center justify-between mx-auto p-4 gap-x-4">
      <RouterLink to="/" class="flex items-center hover:scale-110">
        <span class="material-symbols-outlined"> arrow_back_ios_new </span></RouterLink
      >

      <RouterLink
        :to="`/info/${route.params.cid}`"
        class="text-2xl font-semibold overflow-hidden dark:text-white text-center"
        >{{ name }}</RouterLink
      >
      <button
        v-if="users.length > 2"
        class="flex items-center hover:scale-110"
        @click="multiselectGetUsers()"
        data-modal-target="add-user-modal"
        data-modal-toggle="add-user-modal"
      >
        <span class="material-symbols-outlined text-green-500 hover:text-green-600"
          >add_circle</span
        >
      </button>

      <div
        v-if="users.length > 2"
        id="add-user-modal"
        class="hidden overflow-y-auto overflow-x-hidden fixed z-50 inset-0 p-4"
      >
        <div class="bg-white rounded-lg p-3 space-y-4 w-full flex flex-col max-w-md mx-auto">
          <button
            data-modal-hide="add-user-modal"
            class="w-fit ms-auto h-6 hover:scale-110"
            @focus="removeFocus()"
          >
            <span class="material-symbols-outlined text-red-500 hover:text-red-600"> close </span>
          </button>
          <form @submit.prevent="addUser()" class="space-y-4">
            <multiselect
              name="multi-user"
              v-model="multiselectSelected"
              :options="multiselectOptions"
              :multiple="false"
              :searchable="true"
              label="name"
              track-by="id"
              placeholder="Choose a user"
            />
            <button
              @focus="removeFocus()"
              type="submit"
              data-modal-hide="add-user-modal"
              class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 w-full disabled:opacity-50"
              :disabled="multiselectSelected.length < 1"
            >
              Add User
            </button>
          </form>
        </div>
      </div>

      <div v-if="users.length <= 2" class="w-[24px]"></div>
    </nav>

    <div class="grow pt-2 overflow-y-auto bg-gray-100">
      <div v-for="(messages, key) in messagesWithDates" :key="key" :customname="key">
        <p
          class="sticky top-0 text-center w-fit mx-auto px-2 py-0.5 rounded-full bg-gray-400 shadow-lg text-sm font-bold text-white"
        >
          {{ key }}
        </p>
        <div class="px-1 py-2 space-y-3">
          <div v-for="message in messages" :key="message" :id="`${message.Id}`">
            <div
              v-if="message.IsSystem"
              class="text-center text-xs w-fit justify-self-center bg-amber-100 px-2 rounded-full text-gray-500 shadow-sm"
            >
              {{ message.Content }}
            </div>

            <div
              v-if="message.Sender.Id != userId && !message.IsSystem"
              class="flex items-end gap-1"
            >
              <img
                class="w-6 h-6 rounded-full"
                src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
                alt="Jese image"
              />
              <div
                class="flex flex-col w-fit max-w-[250px] md:max-w-[360px] leading-1.5 px-1.5 py-1 bg-white rounded-r-xl rounded-tl-xl"
              >
                <div class="px-1.5">
                  <span class="text-sm font-semibold text-green-500 dark:text-white">{{
                    message.Sender.Name
                  }}</span>
                </div>

                <img
                  v-if="message.ImageString != ''"
                  :src="`data:image/png;base64,${message.ImageString}`"
                  class="bg-gray-800 rounded-lg my-1 inset-shadow-lg"
                />
                <div class="px-1.5">
                  <div class="flex space-x-3">
                    <p
                      class="text-sm font-normal text-gray-500 dark:text-white wrap-anywhere grow mb-0.5"
                    >
                      {{ message.Content }}
                    </p>
                    <span class="text-xs font-normal text-gray-400 dark:text-gray-400 self-end">{{
                      messageTime(message.Time)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="message.Sender.Id == userId && !message.IsSystem"
              class="flex items-end gap-1 justify-self-end"
            >
              <div
                :id="`mbox-${message.Id}`"
                @mousedown.prevent="message.IsDeleted == false ? deleteMessage(message.Id) : null"
                @mouseup="deleteCancel(message.Id)"
                class="flex flex-col w-fit max-w-[250px] md:max-w-[360px] leading-1.5 px-1.5 py-1 bg-green-500 rounded-l-xl rounded-tr-xl"
              >
                <img
                  v-if="message.ImageString != ''"
                  :src="`data:image/png;base64,${message.ImageString}`"
                  class="rounded-lg bg-gray-800 inset-shadow-2xl mb-1"
                />
                <div class="px-1.5">
                  <div class="flex space-x-3">
                    <p
                      style="-webkit-user-select: none; user-select: none"
                      class="text-sm font-normal text-white dark:text-white grow wrap-anywhere mb-0.5"
                    >
                      {{ message.Content }}
                    </p>
                    <span
                      style="-webkit-user-select: none; user-select: none"
                      class="text-xs font-normal text-white dark:text-gray-400 self-end"
                      >{{ messageTime(message.Time) }}</span
                    >
                  </div>
                </div>
              </div>
              <img
                class="w-6 h-6 rounded-full"
                src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
                alt="Jese image"
              />
            </div>
          </div>
        </div>
      </div>

      <div ref="scrollHere"></div>
    </div>

    <form
      @submit.prevent="sendMessage"
      class="flex justify-between items-center pr-3 py-3 bg-white border-t-2 border-gray-200"
    >
      <label
        for="dropzone-file"
        class="flex flex-col items-center justify-center cursor-pointer ms-1"
      >
        <div class="flex flex-col items-center justify-center">
          <span class="material-symbols-outlined text-gray-500"> attach_file </span>
        </div>
        <input @change="fileChange" id="dropzone-file" type="file" class="hidden" />
      </label>
      <input
        name="message"
        v-model="newMessage"
        class="text-gray-900 placeholder-gray-500 me-1.5 grow bg-gray-200 rounded-full p-2 px-3 focus:ring-green-500 border-0 placeholder:truncate"
        type="text"
        placeholder="Type your message here..."
      />

      <button
        type="submit"
        class="bg-green-500 block text-white rounded-full w-[40px] h-[40px] hover:bg-green-600 transition-all duration-300"
      >
        <i class="bi bi-send text-2xl"></i>
      </button>
    </form>

    <LoadingOverlay
      :active="isLoading"
      :opacity="1"
      :is-full-page="true"
      :can-cancel="false"
      background-color="#fff"
      :z-index="50"
      loader="dots"
      :lock-scroll="true"
      color="#10B981"
    />
  </main>
</template>
