import { createRouter, createWebHistory } from 'vue-router'
import Chats from '../views/Chats.vue'
import Messages from '../views/Messages.vue'
import Login from '@/views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
    },
    {
      path: '/:uid/chats',
      name: 'chats',
      component: Chats,
    },
    {
      path: '/:uid/chats-:cid/messages',
      name: 'messages',
      component: Messages,
    },
  ],
})

export default router
