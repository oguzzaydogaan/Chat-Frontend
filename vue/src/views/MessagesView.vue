<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import Navbar from '../components/Navbar.vue'
const route = useRoute()
const messageContent = ref('')
const chatid = ref(null)
const name = ref('')
const messages = ref([{ id: 0, fromId: '', from: { id: '', name: '' }, content: '' }])
async function GetChat() {
  const response = await fetch(
    'https://localhost:7193/api/chats/' + route.params.cid + '/' + route.params.uid,
  )
  const data = await response.json()
  console.log(data)
  chatid.value = data.id
  name.value = data.name
  messages.value = data.messages
}
async function SendMessage() {
  if (messageContent.value.trim() === '') return
  const response = await fetch('https://localhost:7193/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fromId: route.params.uid,
      content: messageContent.value,
      chatId: chatid.value,
    }),
  })
  if (response.ok) {
    messageContent.value = ''
    await GetChat()
  } else {
    console.error('Failed to send message')
  }
}
type Message = { id: number; fromId: string; content: string; from: { id: string; name: string } }

async function DeleteMessage(message: Message) {
  if (message.fromId != route.params.uid) {
    alert('You can only delete your own messages')
    return
  }
  if (!confirm('Are you sure you want to delete this message?')) return
  const response = await fetch('https://localhost:7193/api/messages/' + message.id, {
    method: 'DELETE',
  })
  if (response.ok) {
    await GetChat()
  } else {
    console.error('Failed to delete message')
  }
}
onMounted(async () => {
  await GetChat()
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
          @click="DeleteMessage(message)"
          :class="`wrap-anywhere select-text shadow-md p-3 rounded-full w-fit ${message.fromId != route.params.uid ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 ms-auto'}`"
        >
          {{ message.fromId == route.params.uid ? message.content : message.content }}
        </p>
      </div>
    </div>

    <div class="flex justify-between gap-5 items-center p-3 bg-white border-t-2 border-gray-200">
      <input
        @keyup.enter="SendMessage"
        v-model="messageContent"
        class="text-gray-600 placeholder-gray-600 grow bg-gray-200 rounded-full text-center p-2 focus:outline-blue-500"
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
