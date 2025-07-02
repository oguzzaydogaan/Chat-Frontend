<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { onMounted, ref, nextTick } from 'vue'
import Navbar from '../components/Navbar.vue'
import checkAuthorization from '@/assets/js/checkAuthorization'
import { useChatsStore } from '@/stores/chats'

const route = useRoute()
const store = ref(useChatsStore())
const socket = ref<WebSocket | null>(null)
const scrollHere = ref<HTMLElement | null>(null)
const newMessage = ref('')
const chatid = ref(null)
const name = ref('')
const messages = ref([
  { Id: 0, UserId: '', Sender: { Id: '', Name: '' }, Content: '', IsDeleted: false },
])
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
  chatid.value = data.Id
  name.value = data.Name
  messages.value = data.Messages
}
async function WsHandler() {
  socket.value = new WebSocket(
    `wss://localhost:7193/ws/message?chatId=${route.params.cid}&userId=${route.params.uid}&accessToken=${localStorage.getItem('token')}`,
  )

  socket.value.onopen = () => {
    console.log('WebSocket connection established')
  }

  socket.value.onmessage = async (event) => {
    console.log(event)
    const data = await JSON.parse(event.data)
    if (data.IsDeleted == true) {
      messages.value = messages.value.filter((msg) => msg.Id != data.Id)
    } else {
      messages.value.push(data)
      const index = store.value.chats.findIndex((c) => c.id == Number(route.params.cid))
      const chat = store.value.chats[index]
      store.value.chats.splice(index, 1)
      store.value.chats.splice(0, 0, chat)
    }
    await nextTick()
    scrollHere.value?.scrollIntoView({ behavior: 'smooth' })
  }

  socket.value.onclose = (event) => {
    socket.value = null
    alert('Oturum sonlandırıldı.')
    console.log(event)
  }
}
onMounted(async () => {
  await GetChat()
  await nextTick()
  scrollHere.value?.scrollIntoView({ behavior: 'smooth' })
  await WsHandler()
})
const SendMessage = () => {
  if (newMessage.value.trim() === '') return
  if (socket.value?.readyState === WebSocket.OPEN) {
    socket.value.send(
      JSON.stringify({
        Content: newMessage.value,
        ChatId: Number(route.params.cid),
        UserId: Number(route.params.uid),
      }),
    )
  }
  newMessage.value = ''
}
async function DeleteMessage(uid: number, mid: number) {
  if (uid != Number(route.params.uid)) {
    alert('You can only delete your own messages')
    return
  }
  if (!confirm('Are you sure you want to delete this message?')) return
  if (socket.value?.readyState === WebSocket.OPEN) {
    socket.value.send('delete/' + String(mid))
  }
}
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
          @click="DeleteMessage(Number(message.Sender.Id), message.Id)"
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
        @keyup.enter="SendMessage"
        v-model="newMessage"
        class="text-gray-600 placeholder-gray-600 grow bg-gray-200 rounded-md text-center p-2 focus:outline-blue-500"
        type="text"
        placeholder="Type your message here..."
      />
      <button
        @click="SendMessage"
        class="bg-blue-500 block text-white rounded-full w-[50px] h-[50px] hover:bg-blue-600 transition-all duration-300"
      >
        <i class="bi bi-send text-2xl"></i>
      </button>
    </div>
  </main>
</template>
