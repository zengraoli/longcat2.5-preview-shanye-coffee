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

| 账号 | 密码 | 角色 | 权限 |
|-|-|-|-|
| admin | admin123 | 管理员 | 全部权限 |
| staff01 | staff123 | 店员（绑门店 1） | 数据看板、商品管理（售罄）、订单管理（仅本门店） |

## 页面

| 页面 | 路径 | 说明 |
|-|-|-|
| 数据看板 | / | 今日营业额/订单量/客单价/新增会员、近 7 天趋势、热销 Top10、最新订单 |
| 商品管理 | /products | 列表（分类/状态筛选、分页）、新增/编辑（含规格）、上下架、售罄 |
| 订单管理 | /orders | 按门店/状态/时间筛选、订单详情、推进状态 |
| 门店管理 | /stores | 门店信息与营业状态管理（仅管理员） |
| 会员管理 | /members | 会员列表（手机号脱敏）与详情（仅管理员） |
| 优惠券 | /coupons | 优惠券模板创建/编辑/停用（仅管理员） |
| 账号与角色 | /accounts | 后台账号新增/停用/重置密码/角色分配（仅管理员） |

## 技术要点

- UI 组件为 shadcn 风格，底层原语使用 Base UI（`@base-ui/react`），不使用 Radix。
- 品牌主题变量见 `src/index.css`（与 web / miniapp 共用品牌色）。
- 统一响应 `{"code":0,"data":..,"message":"ok"}`，金额整数分、时间 UTC ISO8601、手机号脱敏。
- 路由守卫 `RequireAuth` + 角色守卫 `RequireRole`，按钮级权限 `Can`。

## 已知问题

- 需要 server（端口 3300）同时运行才能正常调用接口。
- 构建产物单 chunk 较大（含 Recharts），未做代码分割。
