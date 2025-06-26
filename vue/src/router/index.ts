import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatsView from '../views/ChatsView.vue'
import MessagesView from '../views/MessagesView.vue'



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
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
