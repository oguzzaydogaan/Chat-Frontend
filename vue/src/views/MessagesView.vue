<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import Navbar from '../components/Navbar.vue'
const route = useRoute()
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
onMounted(async () => {
  await GetChat()
})
</script>

<template>
  <main>
    <Navbar class="" />
    <h2 class="text-center text-3xl text-gray-700 my-2 font-semibold">
      {{ name }}
    </h2>
    <div v-for="message in messages" class="mx-4 mb-3">
      <p
        :class="`shadow-md p-3 rounded-full w-fit ${message.fromId != route.params.uid ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 ms-auto'}`"
      >
        {{
          message.fromId == route.params.uid
            ? message.content
            : message.from.name + ': ' + message.content
        }}
      </p>
    </div>
  </main>
</template>
