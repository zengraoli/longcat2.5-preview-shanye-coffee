import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { getSession } from './lib/auth';
import { setToken } from './lib/api';
import './style.css';

// 启动时恢复会话
const session = getSession();
if (session) setToken(session.token);

createApp(App).use(router).mount('#app');
