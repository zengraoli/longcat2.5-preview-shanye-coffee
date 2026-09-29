# server · 山野咖啡 API 服务

Node.js 24 + TypeScript + Fastify + SQLite（better-sqlite3）。

## 启动

```bash
npm install
npm run dev        # 开发模式（tsx watch），默认 http://127.0.0.1:3300
```

其他命令：

```bash
npm run build      # 编译到 dist/
npm start          # 运行编译产物
npm run typecheck  # TypeScript 类型检查
npm test           # 单元测试（vitest）
npm run smoke      # 端到端冒烟：会员登录 → 下单 → 支付 → 状态推进 → 积分到账
```

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

## 约定

- 统一响应 `{"code":0,"data":...,"message":"ok"}`；错误码登记见 `docs/errors.md`。
- 金额一律整数“分”；时间一律 UTC ISO8601；手机号脱敏为 `138****1234`。

## 已知问题

- 会员验证码固定为 123456，仅模拟短信，无真实下发。
- 支付为模拟支付，无真实支付渠道。
