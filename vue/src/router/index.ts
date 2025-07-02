import { createRouter, createWebHistory } from 'vue-router'
import ChatsView from '../views/ChatsView.vue'
import MessagesView from '../views/MessagesView.vue'
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
      component: ChatsView,
    },
    {
      path: '/:uid/chats-:cid/messages',
      name: 'messages',
      component: MessagesView,
    },
  ],
})

export default router
