<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const email = ref('')
const router = useRouter()
const password = ref('')

async function handleSignIn() {
  const response = await fetch('https://localhost:7193/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
    }),
  })
  if (!response.ok) {
    document.getElementById('#error')!.textContent = 'Invalid username or password'
    return
  }
  const data = await response.json()
  localStorage.setItem('token', data.token)
  localStorage.setItem('expiresIn', data.expiresIn)
  localStorage.setItem('userId', data.id)
  router.push('/chats')
}
onMounted(() => {
  if (localStorage.getItem('token')) {
    router.push('/chats')
  }
})
</script>

<template>
  <main class="flex justify-center items-center h-screen px-3">
    <div class="bg-white grid grid-cols-1 w-full shadow-lg rounded-lg max-w-md p-6 px-10">
      <h4 class="text-center text-2xl text-gray-700 font-bold">Sign in</h4>
      <form @submit.prevent="handleSignIn">
        <input
          @keypress.space.prevent=""
          v-model="email"
          class="text-gray-600 placeholder-gray-400 bg-gray-200 rounded-md text-center p-1 mt-5 w-full"
          type="email"
          placeholder="Email"
          required
        />
        <input
          @keypress.space.prevent=""
          v-model="password"
          class="text-gray-600 placeholder-gray-400 bg-gray-200 rounded-md text-center p-1 mt-3 w-full"
          type="text"
          placeholder="Password"
          required
        />
        <button type="submit" class="bg-blue-500 text-white rounded-md p-1 mt-4 text-center w-full">
          Sign in
        </button>
        <RouterLink to="/register" class="text-blue-500 text-sm mt-1 text-center"
          >Don't have an account? Sign Up</RouterLink
        >
        <p id="#error" class="text-red-500 text-sm mt-1 text-center"></p>
      </form>
    </div>
  </main>
</template>
