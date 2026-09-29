# admin · 山野咖啡后台管理

React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui（底层 Base UI）+ Recharts。

## 启动

```bash
npm install
npm run dev        # http://127.0.0.1:5301（/api 代理到 server 3300）
```

其他命令：

```bash
npm run build      # 类型检查 + 构建
npm run typecheck  # TypeScript 类型检查
npm test           # 单元测试（vitest）
```

## 默认账号

| 账号 | 密码 | 角色 |
|-|-|-|
| admin | admin123 | 管理员（全部权限） |
| staff01 | staff123 | 店员（仅本门店订单与售罄） |

## 技术要点

- UI 组件为 shadcn 风格，底层原语使用 Base UI（`@base-ui/react`），不使用 Radix。
- 品牌主题变量见 `src/index.css`（与 web / miniapp 共用品牌色）。
- 统一响应 `{"code":0,"data":..,"message":"ok"}`，金额整数分、时间 UTC ISO8601。

## 已知问题

- 需要 server（端口 3300）同时运行才能正常调用接口。
