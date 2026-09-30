import { defineConfig } from 'vite';
import uniModule from '@dcloudio/vite-plugin-uni';

// uni 插件是 CJS 包，默认导出为插件函数；.ts 配置下需手动取 default
const uni = (uniModule as { default?: unknown }).default ?? uniModule;

// uni-preset-vue 官方模板同款配置：uni 插件内置 vue 编译与平台适配
export default defineConfig({
  plugins: [(uni as () => unknown)()],
  server: {
    port: 5303,
  },
});
