# web · 山野咖啡品牌官网 + 会员中心

Vue 3 + Vite + TypeScript。

## 启动

```bash
npm install
npm run dev        # http://127.0.0.1:5302（/api 代理到 server 3300）
```

其他命令：

```bash
npm run build      # 类型检查 + 构建
npm run typecheck  # TypeScript 类型检查
npm test           # 单元测试（vitest）
```

## 技术要点

- 品牌主题变量见 `src/style.css`（与 admin / miniapp 共用品牌色）。
- 响应式导航：手机端折叠为汉堡菜单。
- 统一响应 `{"code":0,"data":..,"message":"ok"}`，金额整数分、时间 UTC ISO8601、手机号脱敏。

## 已知问题

- 需要 server（端口 3300）同时运行才能正常调用接口。
