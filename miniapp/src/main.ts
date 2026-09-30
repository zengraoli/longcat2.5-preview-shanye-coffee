import { createSSRApp } from 'vue';
import App from './App.vue';
import { getSession } from './lib/auth';
import { setToken } from './lib/api';

// 启动时恢复会话
const session = getSession();
if (session) setToken(session.token);

export function createApp() {
  const app = createSSRApp(App);
  return { app };
}
