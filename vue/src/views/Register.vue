<script setup>
import axios from '@/plugins/axios'
import Swal from 'sweetalert2'
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
    .then(function () {
      Swal.fire({
        icon: 'success',
        title: 'Registration successful',
        text: 'You can now log in with your new account.',
        timer: 2000,
        showConfirmButton: false,
      })
      router.push('/')
    })
    .catch(function (error) {
      if (error.response.status == 400) {
        document.getElementById('#error').textContent = error.response.data
      }
    })
}
onMounted(() => {
  if (localStorage.getItem('token')) {
    router.push('/chats')
  }
})
</script>

<template>
  <main>
    <section class="bg-gray-200 dark:bg-gray-900">
      <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0">
        <a
          href="#"
          class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
        >
          <img class="w-8 h-8 mr-2" src="../assets/img/logo.png" alt="logo" />
          Vue Chat
        </a>
        <div
          class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700"
        >
          <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1
              class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"
            >
              Sign up for free
            </h1>
            <form class="space-y-4 md:space-y-6" @submit.prevent="handleSignUp">
              <div>
                <label
                  for="name"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Your name</label
                >
                <input
                  @keypress.space.prevent=""
                  v-model="name"
                  type="text"
                  class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-green-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label
                  for="email"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Your email</label
                >
                <input
                  @keypress.space.prevent=""
                  v-model="email"
                  type="email"
                  class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-green-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div>
                <label
                  for="password"
                  class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Password</label
                >
                <input
                  @keypress.space.prevent=""
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  pattern="(?=.*[0-9])(?=.*[A-Za-z])(?=.*[^a-zA-Z0-9]).{6,}"
                  title="Password must be at least 6 characters long and contain at least one letter, one number and one special character."
                  class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-green-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                  required
                />
              </div>
              <button
                type="submit"
                class="w-full text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              >
                Sign up
              </button>
              <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                Already have an account?
                <RouterLink
                  to="/"
                  class="font-medium text-green-600 hover:underline dark:text-green-500"
                  >Sign in</RouterLink
                >
              </p>
            </form>
            <p id="#error" class="text-sm text-red-600 dark:text-red-500"></p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
