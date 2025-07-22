<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { initModals } from 'flowbite'
import { onMounted, ref, onUnmounted } from 'vue'
import { useSocketStore } from '@/stores/socket'
import alerts from '@/assets/js/alerts'
import axios from '@/plugins/axios'
import Multiselect from 'vue-multiselect'

const route = useRoute()
const userId = localStorage.getItem('userId')
const socket = useSocketStore()
const scrollHere = ref()
const messages = ref()
socket.SetChatId(Number(route.params.cid))
const newMessage = ref()
const name = ref()
const multiselectSelected = ref([])
const multiselectOptions = ref([])

async function GetChat() {
  axios(`/chats/${route.params.cid}/users/${userId}`)
    .then((response) => {
      name.value = response.data.Name
      messages.value = response.data.Messages
    })
    .then(() => {
      scrollHere.value.scrollIntoView({ behavior: 'smooth' })
    })
}

async function newMessageEvent(event) {
  if (event.detail.ChatId == Number(route.params.cid)) {
    messages.value.push(event.detail)
  }
}
async function deleteMessageEvent(event) {
  if (event.detail.ChatId == Number(route.params.cid)) {
    console.log(event.detail)
    const idx = messages.value.findIndex((m) => m.Id == event.detail.Id)
    if (idx !== -1) {
      messages.value[idx] = event.detail
    }
    if (userId == event.detail.Sender.Id) {
      await alerts.successToast('Message deleted')
    }
  }
}
async function newUserToChatEvent(event) {
  if (event.detail.Id != Number(route.params.cid)) {
    return
  }
  await alerts.successToast('New user joined')
}

async function multiselectGetUsers() {
  var users = await axios.get('/users')
  users.data = users.data.filter((user) => user.id != userId)
  multiselectOptions.value = users.data.map((user) => ({
    id: user.id,
    name: user.name,
  }))
  multiselectSelected.value = []
}

async function addUserToChat() {
  const selectedUser = multiselectSelected.value.id
  if (selectedUser) {
    const socketMessage = {
      Type: 'New-UserToChat',
      Payload: {
        UserId: Number(selectedUser),
        ChatId: Number(route.params.cid),
      },
    }
    socket.sendMessage(socketMessage)
  }
}

function removeFocus() {
  document.activeElement.blur()
}

async function sendMessage() {
  if (!newMessage.value.trim()) {
    newMessage.value = ''
    return
  }
  const socketMessage = {
    Type: 'Send-Message',
    Payload: {
      UserId: Number(userId),
      ChatId: Number(route.params.cid),
      Content: newMessage.value,
    },
  }
  socket.sendMessage(socketMessage)
  newMessage.value = ''
}

async function deleteMessage(id) {
  const socketMessage = {
    Type: 'Delete-Message',
    Payload: {
      MessageId: id,
    },
  }
  socket.sendMessage(socketMessage)
}

function getMessageTime(time) {
  const date = new Date(time)
  const now = new Date()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const diff = (now - date) / (1000 * 60 * 60 * 24)
  if (diff >= 1 && diff < 2) {
    return `Yesterday at ${date.getHours()}:${date.getMinutes()}`
  } else if (diff >= 2 && diff < 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${date.getHours()}:${date.getMinutes()}`
  } else if (diff >= 7 && diff < 365) {
    return `${date.toLocaleDateString('en-US', { day: '2-digit', month: 'long' })} at ${date.getHours()}:${date.getMinutes()}`
  }
  return `${hours}:${minutes}`
}

onMounted(async () => {
  initModals()
  await GetChat()
  socket.connect()
  window.addEventListener('new-message', newMessageEvent)
  window.addEventListener('new-usertochat', newUserToChatEvent)
  window.addEventListener('delete-message', deleteMessageEvent)
})

onUnmounted(() => {
  window.removeEventListener('new-usertochat', newUserToChatEvent)
  window.removeEventListener('new-message', newMessageEvent)
  window.removeEventListener('delete-message', deleteMessageEvent)
})
</script>

<template>
  <main class="h-screen flex flex-col justify-between bg-gray-100">
    <nav class="">
      <div class="flex flex-wrap items-center justify-between mx-auto p-4">
        <RouterLink to="/" class="flex items-center hover:scale-110">
          <span class="material-symbols-outlined"> arrow_back_ios_new </span></RouterLink
        >

        <span class="text-2xl font-semibold whitespace-nowrap dark:text-white hover:scale-110">{{
          name
        }}</span>
        <button
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
            <form @submit.prevent="addUserToChat()" class="space-y-4">
              <multiselect
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
      </div>
    </nav>
    <div class="grow overflow-y-auto bg-gray-200">
      <div class="p-3 space-y-3">
        <div v-for="message in messages">
          <div v-if="message.Sender.Id != userId" class="flex items-start gap-2.5">
            <img
              class="w-8 h-8 rounded-full"
              src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
              alt="Jese image"
            />
            <div
              class="flex flex-col w-fit max-w-[320px] leading-1.5 px-4 py-1 bg-green-500 rounded-e-xl rounded-es-xl"
            >
              <span class="text-sm font-semibold text-white dark:text-white">{{
                message.Sender.Name
              }}</span>
              <div class="flex space-x-3">
                <p class="text-sm font-normal text-gray-200 dark:text-white wrap-anywhere mb-0.5">
                  {{ message.Content }}
                </p>
                <span class="text-xs font-normal text-gray-300 dark:text-gray-400 self-end">{{
                  getMessageTime(message.Time)
                }}</span>
              </div>
            </div>
          </div>
          <div v-if="message.Sender.Id == userId" class="flex items-start gap-2.5 justify-self-end">
            <button
              v-if="!message.IsDeleted"
              class="flex items-center -mr-2 hover:scale-110"
              @click="deleteMessage(message.Id)"
            >
              <span
                class="material-symbols-outlined text-red-500 hover:text-red-600"
                style="font-size: 20px"
                >delete</span
              >
            </button>
            <div
              class="flex flex-col w-fit max-w-[320px] leading-1.5 px-4 py-1 bg-white rounded-e-xl rounded-es-xl"
            >
              <div class="flex space-x-3">
                <p class="text-sm font-normal text-gray-600 dark:text-white wrap-anywhere mb-0.5">
                  {{ message.Content }}
                </p>
                <span class="text-xs font-normal text-gray-500 dark:text-gray-400 self-end">{{
                  getMessageTime(message.Time)
                }}</span>
              </div>
            </div>
            <img
              class="w-8 h-8 rounded-full"
              src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
              alt="Jese image"
            />
          </div>
        </div>
      </div>
      <div ref="scrollHere"></div>
    </div>

    <form
      @submit.prevent="sendMessage"
      class="flex justify-between gap-5 items-center p-3 bg-white border-t-2 border-gray-200"
    >
      <input
        v-model="newMessage"
        class="text-gray-900 placeholder-gray-500 grow bg-gray-200 rounded-full p-2 px-3 focus:ring-green-500 border-0"
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
  </main>
</template>
