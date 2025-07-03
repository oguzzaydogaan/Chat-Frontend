<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { onMounted, ref, nextTick } from 'vue'
import Navbar from '../components/Navbar.vue'
import checkAuthorization from '@/assets/js/checkAuthorization'
import { useSocketStore } from '@/stores/socket'

const route = useRoute()
const socket = useSocketStore()
const scrollHere = ref<HTMLElement | null>(null)
const messages = ref<any>([])
socket.SetName(route.name)
socket.SetChatId(Number(route.params.cid))
const newMessage = ref('')
const name = ref('')

async function GetChat() {
  checkAuthorization()
  const response = await fetch(
    'https://localhost:7193/api/chats/' + route.params.cid + '/users/' + route.params.uid,
    {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')!,
      },
    },
  )
  if (!response.ok) {
    if (response.status == 401) {
      confirm('Oturumun süresi doldu.')
    }
    window.location.href = '/'
  }
  const data = await response.json()
  console.log(data)
  name.value = data.Name
  messages.value = data.Messages
}

async function wsSender(socketMessage: any) {
  socket.sendMessage(socketMessage)
  newMessage.value = ''
}

function newMessageEvent(event: any) {
  if (event.detail.ChatId == Number(route.params.cid)) {
    console.log('Gelen event:', event.detail)
    console.log(messages)
    messages.value.push(event.detail)
  }
}
function deleteMessageEvent(event: any) {
  messages.value = messages.value.filter((m: any) => m.Id != event.detail)
}

onMounted(async () => {
  await GetChat()
  socket.connect(route.params.uid)
  window.addEventListener('new-message', newMessageEvent)
  window.addEventListener('delete-message', deleteMessageEvent)
})
</script>

<template>
  <main class="h-screen flex flex-col justify-between bg-gray-100">
    <Navbar class="" />
    <div class="p-3 bg-blue-200 shadow-md mb-3">
      <h2 class="text-center text-3xl text-gray-700 font-semibold">
        {{ name }}
      </h2>
    </div>
    <div class="grow overflow-y-auto">
      <div v-for="message in messages" class="mx-4 mb-3">
        <p
          @click="
            wsSender({
              Type: 'Delete-Message',
              Payload: {
                MessageId: message.Id,
              },
            })
          "
          :class="`wrap-anywhere select-text shadow-md p-3 rounded-md w-fit ${message.Sender.Id != route.params.uid ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 ms-auto'}`"
        >
          {{
            message.Sender.Id == route.params.uid
              ? message.Content
              : message.Sender.Name + ': ' + message.Content
          }}
        </p>
      </div>

      <div ref="scrollHere"></div>
    </div>

    <div class="flex justify-between gap-5 items-center p-3 bg-white border-t-2 border-gray-200">
      <input
        @keyup.enter="
          wsSender({
            Type: 'Send-Message',
            Payload: {
              UserId: Number(route.params.uid),
              ChatId: Number(route.params.cid),
              Content: newMessage,
            },
          })
        "
        v-model="newMessage"
        class="text-gray-600 placeholder-gray-600 grow bg-gray-200 rounded-md text-center p-2 focus:outline-blue-500"
        type="text"
        placeholder="Type your message here..."
      />
      <button
        @click="
          wsSender({
            Type: 'Send-Message',
            Payload: {
              UserId: Number(route.params.uid),
              ChatId: Number(route.params.cid),
              Content: newMessage,
            },
          })
        "
        class="bg-blue-500 block text-white rounded-full w-[50px] h-[50px] hover:bg-blue-600 transition-all duration-300"
      >
        <i class="bi bi-send text-2xl"></i>
      </button>
    </div>
  </main>
</template>
