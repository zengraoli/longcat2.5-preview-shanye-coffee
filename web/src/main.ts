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
    { path: '/login', component: () => import('@/pages/LoginPage.vue') },
    {
      path: '/member',
      component: () => import('@/pages/MemberPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('member_token')
    if (!token) {
      return { path: '/login' }
    }
  }
  return true
})

const app = createApp(App)
app.use(router)
app.mount('#app')
