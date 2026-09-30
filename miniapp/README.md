# miniapp · 山野咖啡点单小程序

uni-app（Vue 3 + Vite + TypeScript），编译到微信小程序（mp-weixin），H5 模式用于本地调试。

## 启动

```bash
npm install --legacy-peer-deps   # uni-app 的 peer 依赖需 legacy 模式
npm run dev:mp-weixin            # 微信开发者工具调试（监听编译）
npm run build:mp-weixin         # 编译 mp-weixin 产物到 dist/build/mp-weixin
npm run dev:h5                   # H5 调试 http://127.0.0.1:5303
```

其他命令：

```bash
npm run typecheck                # TypeScript 类型检查
npm test                         # 单元测试（vitest）
```

## 微信开发者工具导入方式

1. 执行 `npm run build:mp-weixin`（或 `npm run dev:mp-weixin` 监听编译）。
2. 打开微信开发者工具 → 导入项目。
3. 目录选择 **`<本目录>/dist/build/mp-weixin`**（不是项目根目录）。
4. AppID 可使用测试号；接口基地址默认 `http://127.0.0.1:3300`，需在开发者工具「详情 → 本地设置」中勾选「不校验合法域名」。

## 接口基地址配置

- 小程序端：`src/lib/api.ts` 中 `API_BASE`，默认 `http://127.0.0.1:3300`，可用环境变量 `VITE_API_BASE` 覆盖。
- H5 调试：`vite.config.ts` 中 `server.port` 为 5303，接口直连 `API_BASE`。

## 默认账号

手机号 + 验证码登录（测试验证码固定 `123456`），首次登录自动注册。

## 页面

| 页面 | 路径 | 说明 |
|-|-|-|
| 首页 | pages/index/index | 门店选择、轮播、门店联动推荐商品 |
| 点单 | pages/order/order | 左侧分类右侧商品滚动联动、规格弹窗、底部购物车浮层 |
| 确认订单 | pages/checkout/checkout | 自提/堂食、优惠券（默认最优券）、金额明细、模拟支付 |
| 订单详情 | pages/orderDetail/orderDetail | 取餐码、状态进度条、取消/支付 |
| 我的订单 | pages/orders/orders | 订单列表，下拉刷新可见后台推进的最新状态 |
| 我的 | pages/profile/profile | 会员卡、积分、等级进度、优惠券、登录/退出 |

## 已知问题

- 小程序端为模拟支付，不接入真实微信支付。
- 依赖安装必须使用 `--legacy-peer-deps`（uni-app 包声明的 peer 依赖与 Vue 3 冲突，实际运行无影响）。
- 依赖版本与官方 uni-preset-vue 模板（vite-ts）保持一致，升级需整组同步升级 `@dcloudio/*`。
