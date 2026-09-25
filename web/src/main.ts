import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/theme.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('@/pages/HomePage.vue') },
    { path: '/menu', component: () => import('@/pages/MenuPage.vue') },
    { path: '/stores', component: () => import('@/pages/StoresPage.vue') },
    { path: '/story', component: () => import('@/pages/StoryPage.vue') },
    { path: '/member', component: () => import('@/pages/MemberPage.vue') },
  ],
})

const app = createApp(App)
app.use(router)
app.mount('#app')
