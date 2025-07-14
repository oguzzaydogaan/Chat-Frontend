<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import axios from '@/plugins/axios'

const email = ref('')
const router = useRouter()
const password = ref('')

async function handleSignIn() {
  axios
    .post('/users/login', {
      email: email.value,
      password: password.value,
    })
    .then(function (response) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('expiresIn', response.data.expiresIn)
      localStorage.setItem('userId', response.data.id)
      router.push('/chats')
    })
    .catch(function (error) {
      if (error.response.status == 500)
        document.getElementById('#error')!.textContent = 'Invalid username or password'
    })
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
          type="password"
          placeholder="Password"
          pattern="(?=.*[0-9])(?=.*[A-Za-z])(?=.*[^a-zA-Z0-9]).{6,}"
          title="Password must be at least 6 characters long and contain at least one number and one special character."
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
