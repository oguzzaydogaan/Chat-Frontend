import './assets/tail.css'
import Loading from './components/Loading.vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { ref } from 'vue'
const isDark = ref(false)
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
isDark.value = mediaQuery.matches
if (isDark.value) {
  document.documentElement.classList.add('dark')
}

function handleTheme(event: any) {
  isDark.value = event.matches
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
mediaQuery.addEventListener('change', handleTheme)

const app = createApp(App)

app.component('Loading', Loading)
app.use(createPinia())
app.use(router)

app.mount('#app')
