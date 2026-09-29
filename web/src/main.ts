import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { getSession } from './lib/auth';
import { setToken, setUnauthorizedHandler } from './lib/api';
import { useAuth } from './lib/authStore';
import './style.css';

// 启动时恢复会话
const session = getSession();
if (session) setToken(session.token);

// 未登录时跳转登录页
setUnauthorizedHandler(() => {
  const { logout } = useAuth();
  logout();
  router.push('/login');
});

createApp(App).use(router).mount('#app');
