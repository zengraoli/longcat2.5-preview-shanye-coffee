import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5302,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3300',
        changeOrigin: true,
      },
    },
  },
});
