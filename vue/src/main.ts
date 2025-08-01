import Loading from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/css/index.css'
import './assets/tail.css'
import 'material-symbols'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.component('LoadingOverlay', Loading)
app.use(createPinia())
app.use(router)

app.mount('#app')
