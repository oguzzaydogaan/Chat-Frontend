<script setup>
import { ChevronLeftIcon, XMarkIcon, PhotoIcon } from '@heroicons/vue/24/solid'
import { PaperAirplaneIcon, PlusCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { ExclamationCircleIcon } from '@heroicons/vue/16/solid'
import { RouterLink, useRoute } from 'vue-router'
import { initModals } from 'flowbite'
import { onMounted, ref, onUnmounted, nextTick } from 'vue'
import { useSocketStore } from '@/stores/socket'
import { useChatStore } from '@/stores/chat'
import axios from '@/plugins/axios'
import { RequestEventType } from '@/assets/js/enums'
import alerts from '@/assets/js/alerts'
import ImageSend from '../components/ImageSend.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import Combobox from '@/components/Combobox.vue'
import db from '@/plugins/db'

const route = useRoute()
const userId = localStorage.getItem('userId')
const userName = localStorage.getItem('name')
const notSends = ref([])
const socket = useSocketStore()
const chatStore = useChatStore()
const scrollHere = ref()
const base64 = ref()
const previewBase64 = ref()
const fileInput = ref()
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
const showImageSend = ref(false)
const imagePreviewMode = ref(false)
const isScrolledUp = ref(false)
var timeOutId = 0

function FindKey(message) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
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

  return key
}

function findInsertIndex(arr, item) {
  let low = 0
  let high = arr.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (arr[mid].Time < item.Time) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return low
}

async function GetChat() {
  const response = await axios(`/chats/${route.params.cid}/users/${userId}`)
  name.value = response.data.Name
  messages.value = response.data.Messages
  users.value = response.data.Users

  messages.value.forEach((message) => {
    if (!message.Seens.some((seen) => seen.UserId == Number(userId))) {
      notSeenMessageIds.value.push(message.Id)
    }

    let key = FindKey(message)
    if (!messagesWithDates.value[key]) {
      messagesWithDates.value[key] = []
    }
    messagesWithDates.value[key].push(message)
  })
  notSends.value.forEach((s) => {
    if (s.Payload.Message.ChatId == Number(route.params.cid)) {
      let key = FindKey(s.Payload.Message)
      if (!messagesWithDates.value[key]) {
        messagesWithDates.value[key] = [s.Payload.Message]
      } else {
        const insertIndex = findInsertIndex(messagesWithDates.value[key], s.Payload.Message)
        messagesWithDates.value[key].splice(insertIndex, 0, s.Payload.Message)
      }
    }
  })
  await nextTick()
  scrollHere.value.scrollIntoView({ behavior: 'smooth' })
}

async function onScroll(event) {
  let distance = event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight
  isScrolledUp.value = distance > 100
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
}
async function onNewMessage(event) {
  notSends.value.filter((s) => s.Payload.Message.LocalId != event.detail.LocalId)
  db.deleteNotSend(event.detail.LocalId)
  chatStore.filterUnSent(event.detail.LocalId)
  if (event.detail.ChatId == Number(route.params.cid)) {
    if (event.detail.Sender.Id != Number(userId)) {
      if (!messagesWithDates.value['Today']) {
        messagesWithDates.value['Today'] = []
      }
      messagesWithDates.value['Today'].push(event.detail)
      const audio = new Audio('/sounds/inside-chat-notification.mp3')
      audio.play()
      const socketMessage = {
        Type: RequestEventType.Message_See,
        Payload: {
          Ids: [event.detail.Id],
          Id: event.detail.ChatId,
        },
        Sender: { Id: Number(userId), Name: userName },
      }
      socket.sendMessage(socketMessage)
    } else {
      let key = FindKey(event.detail)
      let index = messagesWithDates.value[key].findIndex((m) => m.LocalId == event.detail.LocalId)
      messagesWithDates.value[key][index] = event.detail
      const audio = new Audio('/sounds/inside-chat-notification.mp3')
      audio.play()
    }
    if (!isScrolledUp.value) {
      await nextTick()
      scrollHere.value.scrollIntoView({ behavior: 'smooth' })
    }
  } else {
    const audio = new Audio('/sounds/notification.mp3')
    audio.play()
    chatStore.addId(event.detail.ChatId)
  }
}
async function onNewChat(event) {
  chatStore.addId(event.detail.Payload.Chat.Id)
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
        Type: RequestEventType.Message_See,
        Payload: {
          Ids: [event.detail.Id],
          Id: event.detail.ChatId,
        },
        Sender: { Id: Number(userId), Name: userName },
      }
      socket.sendMessage(socketMessage)
    }
  } else {
    chatStore.addId(event.detail.ChatId)
  }
}
async function onUserJoin(event) {
  if (event.detail.Payload.Chat.Id != Number(route.params.cid)) {
    chatStore.addId(event.detail.Payload.Chat.Id)
    return
  }
  if (!messagesWithDates.value['Today']) {
    messagesWithDates.value['Today'] = []
  }
  messagesWithDates.value['Today'].push(event.detail.Payload.Message)
  users.value = event.detail.Payload.Chat.Users
  if (event.detail.Sender.Id != Number(userId)) {
    const socketMessage = {
      Type: RequestEventType.Message_See,
      Payload: {
        Ids: [event.detail.Payload.Message.Id],
        Id: event.detail.Payload.Message.ChatId,
      },
      Sender: { Id: Number(userId), Name: userName },
    }
    socket.sendMessage(socketMessage)
  }
}

async function multiselectGetUsers() {
  var allUsers = await axios.get('/users/verifieds')
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
      Type: RequestEventType.Chat_AddUser,
      Payload: {
        Message: {
          UserId: Number(selectedUser),
          ChatId: Number(route.params.cid),
        },
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
  if (event.target.files[0]) {
    if (event.target.files[0].size > 1024 * 1024 * 20) {
      await alerts.errorToast('Choose an image smaller than 20Mb')
      fileInput.value.value = null
      return
    }
    base64.value = await fileToBase64(event.target.files[0])
    showImageSend.value = true
  }
}
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function sendMessage(msg, img) {
  if ((!msg || !msg.trim()) && !img) {
    msg = ''
    return
  }
  const socketMessage = {
    Type: RequestEventType.Message_Send,
    Payload: {
      Message: {
        UserId: Number(userId),
        ChatId: Number(route.params.cid),
        Content: msg,
        ImageString: img ?? '',
        Time: new Date().toISOString(),
        LocalId: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        }),
      },
    },
    Sender: { Id: Number(userId), Name: userName },
  }
  notSends.value.push(socketMessage)
  db.saveNotSend(socketMessage)
  chatStore.pushUnSent(socketMessage)
  let key = FindKey(socketMessage.Payload.Message)
  if (!messagesWithDates.value[key]) {
    messagesWithDates.value[key] = [socketMessage.Payload.Message]
  } else {
    const insertIndex = findInsertIndex(messagesWithDates.value[key], socketMessage.Payload.Message)
    messagesWithDates.value[key].splice(insertIndex, 0, socketMessage.Payload.Message)
  }
  socket.sendMessage(socketMessage)
  closeImageSendModal()
}

async function sendUnsent(lid) {
  socket.sendMessage(await db.getNotSend(lid))
}

function closeImageSendModal() {
  if (showImageSend.value) {
    showImageSend.value = false
  }
  newMessage.value = ''
  base64.value = null
  fileInput.value.value = null
}
function showImage(str) {
  previewBase64.value = str
  imagePreviewMode.value = true
}
function closeImagePreview() {
  if (imagePreviewMode.value) {
    imagePreviewMode.value = false
  }
  previewBase64.value = null
}

async function deleteMessage(id) {
  const div = document.getElementById('mbox-' + id)
  div.classList.remove('bg-green-500')
  div.classList.add('bg-green-600')
  timeOutId = setTimeout(async () => {
    const socketMessage = {
      Type: RequestEventType.Message_Delete,
      Payload: {
        Id: id,
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
  chatStore.removeId(Number(route.params.cid))
  notSends.value = await db.getAllNotSends()
  await GetChat()
  socket.connect()
  window.addEventListener('new-message', onNewMessage)
  window.addEventListener('new-chat', onNewChat)
  window.addEventListener('new-seen', onSeen)
  window.addEventListener('user-join', onUserJoin)
  window.addEventListener('delete-message', onDeleteMessage)
  if (notSeenMessageIds.value.length > 0) {
    const socketMessage = {
      Type: RequestEventType.Message_See,
      Payload: {
        Ids: notSeenMessageIds.value,
        Id: Number(route.params.cid),
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
  window.removeEventListener('new-chat', onNewChat)
  window.removeEventListener('delete-message', onDeleteMessage)
})
</script>

<template>
  <main class="h-dvh flex flex-col justify-between">
    <nav
      class="flex w-full bg-white dark:bg-gray-900 items-center justify-between mx-auto p-4 gap-x-4"
    >
      <RouterLink to="/" class="hover:scale-110 cursor-pointer flex items-center">
        <ChevronLeftIcon class="size-7 text-black dark:text-white" />
        <p v-if="chatStore.notSeenChatIds.length > 0" class="absolute ms-6 dark:text-white text-sm">
          {{ chatStore.notSeenChatIds.length <= 99 ? chatStore.notSeenChatIds.length : '+99' }}
        </p></RouterLink
      >

      <RouterLink
        :to="`/info/${route.params.cid}`"
        class="text-2xl font-semibold overflow-hidden dark:text-white text-black text-center"
        >{{ name }}</RouterLink
      >
      <button
        v-if="users.length > 2"
        class="hover:scale-110 cursor-pointer"
        @click="multiselectGetUsers()"
        data-modal-target="add-user-modal"
        data-modal-toggle="add-user-modal"
      >
        <PlusCircleIcon
          class="size-7 text-green-500 dark:text-green-600 hover:text-green-600 dark:hover:text-green-700"
        />
      </button>

      <div
        v-if="users.length > 2"
        id="add-user-modal"
        class="hidden overflow-y-auto overflow-x-hidden fixed z-50 inset-0 p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-4 w-full flex flex-col max-w-md mx-auto"
        >
          <button
            data-modal-hide="add-user-modal"
            class="ms-auto hover:scale-110"
            @focus="removeFocus()"
          >
            <XMarkIcon class="text-red-500 size-6" />
          </button>
          <form @submit.prevent="addUser()" class="space-y-4">
            <Combobox
              v-model="multiselectSelected"
              :is-multiple="false"
              :data="multiselectOptions"
            />
            <button
              @focus="removeFocus()"
              type="submit"
              data-modal-hide="add-user-modal"
              class="bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 w-full disabled:opacity-50"
              :disabled="multiselectSelected.length < 1"
            >
              Add User
            </button>
          </form>
        </div>
      </div>

      <div v-if="users.length <= 2" class="w-[24px]"></div>
    </nav>

    <div
      @scroll="onScroll"
      class="grow min-h-[200px] pt-2 overflow-y-auto bg-gray-100 dark:bg-gray-800"
    >
      <div v-for="(messages, key) in messagesWithDates" :key="key" :customname="key">
        <p
          class="sticky top-0 text-center w-fit mx-auto px-2 py-0.5 rounded-full bg-gray-400 dark:bg-gray-700 shadow-lg text-sm font-bold text-white"
        >
          {{ key }}
        </p>
        <div class="px-1 py-2 space-y-3">
          <div v-for="message in messages" :key="message" :id="`${message.Id}`">
            <div v-if="message.Id && message.IsSystem" class="flex justify-center">
              <p
                class="text-center text-xs w-fit bg-amber-100 dark:bg-amber-200 px-2 rounded-full py-[1px] text-gray-400 dark:text-gray-600 shadow-sm"
              >
                {{ message.Content }}
              </p>
            </div>

            <div
              v-if="message.Id && message.Sender.Id != userId && !message.IsSystem"
              class="flex items-end gap-1"
            >
              <img
                class="w-6 h-6 rounded-full"
                src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
                alt="Jese image"
              />
              <div
                class="flex flex-col w-fit max-w-[250px] md:max-w-[360px] leading-1.5 px-1.5 py-1 bg-white dark:bg-gray-700 rounded-r-xl rounded-tl-xl"
              >
                <div class="px-1.5">
                  <span class="text-sm font-semibold text-green-500">{{
                    message.Sender.Name
                  }}</span>
                </div>

                <img
                  v-if="message.ImageString != ''"
                  :src="`${message.ImageString}`"
                  class="bg-gray-800 rounded-lg my-1 border border-gray-200 shadow dark:border-gray-800"
                  @click="showImage(message.ImageString)"
                />
                <div class="px-1.5">
                  <div class="flex space-x-3">
                    <p
                      class="text-sm font-normal text-gray-500 dark:text-white wrap-anywhere grow mb-0.5"
                    >
                      {{ message.Content }}
                    </p>
                    <span class="text-xs font-normal text-gray-400 dark:text-gray-300 self-end">{{
                      messageTime(message.Time)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="message.Id && message.Sender.Id == userId && !message.IsSystem"
              class="flex items-end gap-1 justify-end"
            >
              <div
                :id="`mbox-${message.Id}`"
                @mousedown.prevent="message.IsDeleted == false ? deleteMessage(message.Id) : null"
                @mouseup="deleteCancel(message.Id)"
                class="flex flex-col w-fit max-w-[250px] md:max-w-[360px] leading-1.5 px-1.5 py-1 bg-green-500 dark:bg-green-700 rounded-l-xl rounded-tr-xl"
              >
                <img
                  v-if="message.ImageString != ''"
                  :src="`${message.ImageString}`"
                  class="rounded-lg bg-gray-800 mb-1 border border-green-700 dark:border-green-800 shadow"
                  @click="showImage(message.ImageString)"
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
                      class="text-xs font-normal text-white dark:text-gray-200 self-end"
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

            <div v-if="!message.Id" class="flex items-end gap-1 justify-end">
              <div
                class="flex flex-col w-fit max-w-[250px] md:max-w-[360px] leading-1.5 px-1.5 py-1 bg-green-500 dark:bg-green-700 rounded-l-xl rounded-tr-xl"
              >
                <img
                  v-if="message.ImageString != ''"
                  :src="`${message.ImageString}`"
                  class="rounded-lg bg-gray-800 mb-1 border border-green-700 dark:border-green-800 shadow"
                  @click="showImage(message.ImageString)"
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
                      class="text-xs font-normal text-white dark:text-gray-200 self-end"
                      >{{ messageTime(message.Time) }}
                      <ClockIcon
                        v-if="chatStore.isContainUnSent(message.LocalId)"
                        class="size-3 text-white dark:text-gray-200 inline-block"
                      />
                      <ExclamationCircleIcon
                        v-else
                        @click="sendUnsent(message.LocalId)"
                        class="size-4 text-red-500 dark:text-red-600 inline-block"
                      />
                    </span>
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
      @submit.prevent="sendMessage(newMessage, base64)"
      class="flex justify-between items-center px-2 py-3 gap-1.5 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-0"
    >
      <label for="dropzone-file" class="flex flex-col items-center justify-center cursor-pointer">
        <div class="flex flex-col items-center justify-center">
          <PhotoIcon class="text-gray-500 size-6" />
        </div>
        <input @change="fileChange" ref="fileInput" id="dropzone-file" type="file" class="hidden" />
      </label>
      <input
        name="message"
        v-model="newMessage"
        class="text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 grow bg-gray-200 dark:bg-gray-700 rounded-full p-2 px-3 focus:ring-green-500 border-0 placeholder:overflow-hidden"
        type="text"
        placeholder="Type your message here..."
      />

      <button
        type="submit"
        class="flex bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white rounded-full w-[40px] h-[40px] items-center justify-center cursor-pointer"
      >
        <PaperAirplaneIcon class="size-6" />
      </button>
    </form>

    <ImagePreview v-if="imagePreviewMode" :img="previewBase64" @close="closeImagePreview" />
    <ImageSend
      v-if="showImageSend"
      :img="base64"
      :msg="newMessage"
      @send-image="sendMessage"
      @close="closeImageSendModal"
    />
    <Loading v-if="isLoading" :is-full-page="true" />
  </main>
</template>
