<script setup lang="ts">
import axios from '@/plugins/axios'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')

async function handleSignUp() {
  axios
    .post(`/users/register`, {
      name: name.value,
      email: email.value,
      password: password.value,
    })
    .then(function (response) {
      router.push('/')
    })
    .catch(function (error) {
      if (error.response.status == 500)
        document.getElementById('#error')!.textContent = 'An error occured'
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
      <h4 class="text-center text-2xl text-gray-700 font-bold">Sign up</h4>
      <form @submit.prevent="handleSignUp">
        <input
          @keypress.space.prevent=""
          v-model="name"
          class="text-gray-600 placeholder-gray-400 bg-gray-200 rounded-md text-center p-1 mt-5 w-full"
          type="text"
          placeholder="Name"
          required
        />
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
        <RouterLink to="/" class="text-blue-500 text-sm mt-1 text-center"
          >Already have an account? Sign In</RouterLink
        >
        <p id="#error" class="text-red-500 text-sm mt-1 text-center"></p>
      </form>
    </div>
  </main>
</template>
