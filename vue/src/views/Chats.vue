<script setup>
import { PlusCircleIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { initDropdowns, initModals } from 'flowbite'
import { RouterLink, useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import { useSocketStore } from '@/stores/socket'
import { useChatStore } from '@/stores/chat'
import axios from '@/plugins/axios'
import { RequestEventType } from '@/assets/js/enums'
import Combobox from '@/components/Combobox.vue'

const router = useRouter()
const userId = localStorage.getItem('userId')
const uname = localStorage.getItem('name')
const email = localStorage.getItem('email')
const socket = useSocketStore()
const chatStore = useChatStore()
const chats = ref([])
const chatName = ref('')
const searchQuery = ref('')
const multiselectSelected = ref([])
const multiselectOptions = ref([])
const isLoading = ref(false)
const fullScreen = ref(true)

async function GetChats() {
  const response = await axios(`/users/${userId}/chats`)
  chats.value = response.data
  chats.value.forEach((chat) => {
    if (chat.count != 0) {
      chatStore.addId(chat.id)
    }
  })
}

async function Search(query) {
  fullScreen.value = false
  isLoading.value = true
  if (!query) {
    await GetChats()
    isLoading.value = false
    return
  }
  query = query.toLowerCase()
  isLoading.value = true
  const response = await axios(`/users/${userId}/chats/search?searchTerm=${query}`)
  chats.value = response.data
  isLoading.value = false
}

async function onNewMessage(event) {
  const audio = new Audio('/sounds/notification.mp3')
  audio.play()
  chatStore.addId(event.detail.ChatId)
  if (searchQuery.value != '') {
    return
  }
  const index = chats.value.findIndex((c) => c.id == event.detail.ChatId)
  if (index != -1) {
    const chat = chats.value[index]
    if (chat.count != -1) {
      chat.count += 1
    }
    if (index != 0) {
      chats.value.splice(index, 1)
      chats.value.splice(0, 0, chat)
    }
  }
}

async function onDeleteMessage(event) {
  chatStore.addId(event.detail.ChatId)
  if (searchQuery.value != '') {
    return
  }
  const index = chats.value.findIndex((c) => c.id == event.detail.ChatId)
  if (index != -1) {
    const chat = chats.value[index]
    chat.count += 1
    if (index != 0) {
      chats.value.splice(index, 1)
      chats.value.splice(0, 0, chat)
    }
  }
}

async function onNewChat(event) {
  if (event.detail.Sender.Id == Number(userId)) {
    router.push(`/messages/${event.detail.Payload.Chat.Id}`)
  } else {
    chats.value.splice(0, 0, {
      id: event.detail.Payload.Chat.Id,
      name: event.detail.Payload.Chat.Name,
      count: -1,
    })
    chatStore.addId(event.detail.Payload.Chat.Id)
    const audio = new Audio('/sounds/notification.mp3')
    audio.play()
  }
}

async function onUserJoin(event) {
  chatStore.addId(event.detail.Payload.Chat.Id)
  if (searchQuery.value != '') {
    return
  }
  let chat = chats.value.find((c) => c.id == event.detail.Payload.Chat.Id)
  if (chat) {
    if (chat.count != -1) {
      chat.count += 1
    }
    let index = chats.value.indexOf(chat)
    chats.value.splice(index, 1)
    chats.value.splice(0, 0, chat)
  } else {
    chats.value.splice(0, 0, {
      id: event.detail.Payload.Chat.Id,
      name: event.detail.Payload.Chat.Name,
      count: -1,
    })
  }
}

async function multiselectGetUsers() {
  document.getElementById('add-chat-dropdown').classList.add('hidden')
  var users = await axios.get('/users/verifieds')
  users.data = users.data.filter((user) => user.id != userId)
  multiselectSelected.value = []
  multiselectOptions.value = users.data.map((user) => ({
    id: user.id,
    name: user.name,
  }))
  chatName.value = ''
}

async function addGroupChat() {
  removeFocus()
  const selectedUsersIds = multiselectSelected.value.map((user) => user.id)
  selectedUsersIds.push(Number(userId))
  const socketMessage = {
    Type: RequestEventType.Chat_Create,
    Payload: {
      Chat: {
        Name: chatName.value,
        UserIds: selectedUsersIds,
      },
    },
    Sender: { Id: Number(userId), Name: uname },
  }
  socket.sendMessage(socketMessage)
}

async function addPersonalChat() {
  removeFocus()
  const selectedUser = multiselectSelected.value.id
  if (selectedUser) {
    const socketMessage = {
      Type: RequestEventType.Chat_Create,
      Payload: {
        Chat: {
          UserIds: [Number(userId), Number(selectedUser)],
        },
      },
      Sender: { Id: Number(userId), Name: uname },
    }
    socket.sendMessage(socketMessage)
  }
}

function removeFocus() {
  document.activeElement.blur()
}

onMounted(async () => {
  fullScreen.value = true
  isLoading.value = true
  initDropdowns()
  initModals()
  await GetChats()
  socket.connect()
  window.addEventListener('new-chat', onNewChat)
  window.addEventListener('user-join', onUserJoin)
  window.addEventListener('new-message', onNewMessage)
  window.addEventListener('delete-message', onDeleteMessage)
  isLoading.value = false
})

onUnmounted(() => {
  window.removeEventListener('new-chat', onNewChat)
  window.removeEventListener('user-join', onUserJoin)
  window.removeEventListener('new-message', onNewMessage)
  window.removeEventListener('delete-message', onDeleteMessage)
})
</script>

<template>
  <main class="min-h-dvh dark:bg-gray-900">
    <nav class="flex flex-wrap w-full items-center justify-between mx-auto p-4">
      <div class="flex items-center space-x-1 rtl:space-x-reverse">
        <span class="text-2xl font-semibold whitespace-nowrap dark:text-white">Chats</span>
      </div>
      <div class="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <button
          type="button"
          class="flex hover:scale-105 text-sm bg-gray-800 rounded-full me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
          id="user-menu-button"
          aria-expanded="false"
          data-dropdown-toggle="user-dropdown"
          data-dropdown-placement="bottom"
        >
          <span class="sr-only">Open user menu</span>
          <img
            class="w-8 h-8 rounded-full"
            src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
            alt="user photo"
          />
        </button>
        <!-- Dropdown menu -->
        <div
          class="z-10 hidden my-4 text-base max-w-[150px] list-none bg-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg dark:bg-gray-700 dark:divide-gray-600"
          id="user-dropdown"
        >
          <div class="px-4 py-3 border-b border-gray-300 dark:border-gray-600">
            <span class="block text-sm text-gray-900 dark:text-white">{{ uname }}</span>
            <span class="block text-xs text-gray-500 truncate dark:text-gray-400">{{ email }}</span>
          </div>
          <ul class="" aria-labelledby="user-menu-button">
            <li>
              <button
                class="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
              >
                Settings
              </button>
            </li>
            <li>
              <button
                @click="socket.disconnect()"
                class="block w-full rounded-b-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
              >
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="flex items-center mx-auto px-4 py-2">
      <div class="relative w-full">
        <div class="absolute inset-y-0 start-0 flex items-center ps-2 pointer-events-none">
          <MagnifyingGlassIcon class="text-gray-500 size-5" />
        </div>
        <input
          @input="Search(searchQuery)"
          v-model="searchQuery"
          name="search"
          autocomplete="off"
          type="search"
          id="simple-search"
          class="bg-gray-200 border-0 text-gray-900 rounded-lg focus:ring-green-500 block w-full ps-8 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
          placeholder="Search chat name..."
          :disabled="chats.length < 1 && searchQuery.length < 1"
        />
      </div>

      <button
        type="button"
        class="ms-1"
        id="add-chat-button"
        aria-expanded="true"
        data-dropdown-toggle="add-chat-dropdown"
      >
        <PlusCircleIcon
          class="size-8 text-green-500 hover:text-green-600 dark:text-green-600 dark:hover:text-green-700"
        />
      </button>
      <!-- Dropdown menu -->
      <div
        class="z-10 hidden text-base list-none bg-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg dark:bg-gray-700 dark:divide-gray-600"
        id="add-chat-dropdown"
      >
        <ul class="" aria-labelledby="user-menu-button">
          <li>
            <button
              @click="multiselectGetUsers()"
              data-modal-target="add-personal-chat-modal"
              data-modal-toggle="add-personal-chat-modal"
              class="block rounded-t-lg w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
            >
              Personal Chat
            </button>
          </li>
          <li>
            <button
              @click="multiselectGetUsers()"
              data-modal-target="add-group-chat-modal"
              data-modal-toggle="add-group-chat-modal"
              class="block rounded-b-lg w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
            >
              Group Chat
            </button>
          </li>
        </ul>
      </div>
      <div id="add-personal-chat-modal" class="fixed inset-0 z-50 p-4 hidden">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-4 w-full flex flex-col max-w-md mx-auto"
        >
          <button
            @focus="removeFocus()"
            data-modal-hide="add-personal-chat-modal"
            class="text-gray-500 hover:text-gray-700 ms-auto hover:scale-110"
          >
            <XMarkIcon class="text-red-500 size-6" />
          </button>
          <form @submit.prevent="addPersonalChat()" class="space-y-4">
            <Combobox
              :is-multiple="false"
              :data="multiselectOptions"
              v-model="multiselectSelected"
            />
            <button
              type="submit"
              data-modal-hide="add-personal-chat-modal"
              class="bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 w-full disabled:opacity-50"
              :disabled="multiselectSelected.length < 1"
            >
              Create Chat
            </button>
          </form>
        </div>
      </div>

      <div id="add-group-chat-modal" class="fixed inset-0 z-50 p-4 space-x-2 hidden">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-4 w-full flex flex-col max-w-md mx-auto"
        >
          <button
            @focus="removeFocus()"
            data-modal-hide="add-group-chat-modal"
            class="text-gray-500 hover:text-gray-700 ms-auto hover:scale-110"
          >
            <XMarkIcon class="text-red-500 size-6" />
          </button>
          <form @submit.prevent="addGroupChat(chatName)" class="space-y-4">
            <input
              name="chat-name"
              type="text"
              v-model="chatName"
              placeholder="Enter chat name..."
              maxlength="30"
              class="bg-gray-200 dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white rounded-lg text-sm p-3 w-full border-0 focus:ring-green-500 focus:border-green-500"
            />
            <Combobox
              :is-multiple="true"
              :data="multiselectOptions"
              v-model="multiselectSelected"
            />
            <button
              type="submit"
              data-modal-hide="add-group-chat-modal"
              class="bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 w-full disabled:opacity-50"
              :disabled="multiselectSelected.length < 2 || !chatName"
            >
              Create Group
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="relative min-h-[56.67px] px-4">
      <Loading v-if="isLoading" :is-full-page="fullScreen" />
      <RouterLink
        v-for="chat in chats"
        :to="`/messages/${chat.id}`"
        class="block border-b border-gray-300 dark:border-gray-400 p-4 hover:bg-green-100 dark:hover:bg-gray-700 dark:text-white"
      >
        <div class="font-bold flex justify-between items-center">
          <p>{{ chat.name }}</p>
          <span
            v-if="chat.count > 0"
            class="bg-green-500 text-white text-xs font-medium rounded-full px-2 py-0.5"
          >
            {{ chat.count }}
          </span>
          <span
            v-if="chat.count == -1"
            class="bg-green-500 text-white text-xs font-medium rounded-full px-2 py-0.5 text-center"
          >
            new
          </span>
        </div>
      </RouterLink>
      <div v-if="chats.length < 1 && isLoading == false" class="text-center text-gray-500 p-4">
        No chats found.
      </div>
    </div>
  </main>
</template>
