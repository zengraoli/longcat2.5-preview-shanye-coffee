import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Menu from './pages/Menu.vue';
import Stores from './pages/Stores.vue';
import Story from './pages/Story.vue';
import Member from './pages/Member.vue';
import Login from './pages/Login.vue';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/menu', name: 'menu', component: Menu },
  { path: '/stores', name: 'stores', component: Stores },
  { path: '/story', name: 'story', component: Story },
  { path: '/member', name: 'member', component: Member, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: Login },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// 会员中心需登录
router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('shanye_web_token');
    if (!token) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }
  }
});
