import { createRouter, createWebHistory } from 'vue-router'
import Chats from '../views/Chats.vue'
import Messages from '../views/Messages.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import ChatInfo from '@/views/ChatInfo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/chats',
      name: 'chats',
      component: Chats,
    },
    {
      path: '/messages/:cid',
      name: 'messages',
      component: Messages,
    },
    {
      path: '/info/:cid',
      name: 'info',
      component: ChatInfo,
    },
  ],
})

export default router
