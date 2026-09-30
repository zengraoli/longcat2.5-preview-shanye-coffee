# server · 山野咖啡 API 服务

Node.js 24 + TypeScript + Fastify + SQLite（better-sqlite3）。

## 启动

```bash
npm install
npm run dev        # 开发模式（tsx watch），默认 http://127.0.0.1:3300
```

启动时自动建表并写入种子数据（幂等，重复启动不会重复写入）。

其他命令：

```bash
npm run build      # 编译到 dist/
npm start          # 运行编译产物
npm run typecheck  # TypeScript 类型检查
npm test           # 单元测试（vitest）
npm run smoke      # 端到端冒烟：会员登录 → 下单 → 支付 → 状态推进 → 积分到账
```

## 文档

- OpenAPI 文档页：启动后访问 `http://127.0.0.1:3300/docs`
- OpenAPI JSON：`http://127.0.0.1:3300/docs/json`
- 错误码登记：`docs/errors.md`

## 配置（环境变量）

| 变量 | 默认值 | 说明 |
|-|-|-|
| `PORT` | 3300 | 监听端口 |
| `HOST` | 0.0.0.0 | 监听地址 |
| `DB_FILE` | data/app.db | SQLite 文件路径，测试可用 `:memory:` |
| `TOKEN_TTL_HOURS` | 72 | 登录 token 有效期（小时） |
| `MEMBER_CODE` | 123456 | 会员登录固定验证码（模拟短信） |

## 默认账号

| 端 | 账号 | 密码 | 角色 |
|-|-|-|-|
| 后台 | admin | admin123 | 管理员（全部权限） |
| 后台 | staff01 | staff123 | 店员（仅本门店订单与售罄） |
| 会员 | 任意手机号 | 验证码 123456 | 会员 |

## 接口概览

| 模块 | 接口 |
|-|-|-|
| 健康检查 | `GET /health` |
| 会员认证 | `POST /api/member/login`、`GET /api/member/me` |
| 后台认证 | `POST /api/admin/login`、`GET /api/admin/me` |
| 门店 | `GET /api/stores`、`GET /api/stores/:id` |
| 商品 | `GET /api/categories`、`GET /api/products`、`GET /api/products/:id` |
| 后台商品 | `GET /api/admin/products`、`PATCH /api/admin/products/:id/status`、`PATCH /api/admin/products/:id/sold-out` |
| 优惠券 | `POST /api/coupons/:templateId/claim`、`GET /api/member/coupons`、`GET /api/member/coupons/best` |
| 活动 | `GET /api/promotions`（公开，当前生效活动与适用商品） |
| 订单 | `POST /api/orders`、`GET /api/orders`、`GET /api/orders/:id`、`POST /api/orders/:id/pay`、`POST /api/orders/:id/cancel` |
| 后台订单 | `GET /api/admin/orders`、`GET /api/admin/orders/:id`、`POST /api/admin/orders/:id/advance` |
| 后台活动 | `GET /api/admin/promotions`、`POST /api/admin/promotions`、`PATCH /api/admin/promotions/:id`、`POST /api/admin/promotions/:id/toggle` |

## 约定

- 统一响应 `{"code":0,"data":...,"message":"ok"}`；错误码登记见 `docs/errors.md`。
- 金额一律整数“分”；时间一律 UTC ISO8601；会员手机号在列表/后台接口中脱敏为 `138****1234`。
- 订单状态：待支付 → 已支付 → 制作中 → 待取餐 → 已完成；支付前可取消。
- 积分：每消费 1 元（实付）积 1 分；等级银卡 0 / 金卡 500 / 黑卡 2000，自动升级。

## 已知问题

- 会员验证码固定为 123456，仅模拟短信，无真实下发。
- 支付为模拟支付，无真实支付渠道。
- 门店电话为公开营业电话，未脱敏；会员手机号在后台订单列表等接口中脱敏。
