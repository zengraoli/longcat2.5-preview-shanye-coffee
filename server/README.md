# 山野咖啡 API 服务

Node.js 24 + TypeScript + Fastify + SQLite（node:sqlite）

## 启动

```bash
npm install
npm run dev          # 开发模式（tsx watch）
npm run build        # 编译到 dist/
npm start            # 运行编译产物
```

默认监听 `http://127.0.0.1:3300`。

启动时自动建表并写入种子数据（3 家门店、4 个分类、27 个商品、2 个后台账号、2 种优惠券），重复启动不会重复写入。

## 默认账号

| 角色 | 用户名 | 密码 |
|---|---|---|
| 管理员 | admin | admin123 |
| 店员（望京SOHO店） | staff01 | staff123 |

会员登录：任意 11 位手机号，验证码固定 `123456`。

## 测试与冒烟

```bash
npm run typecheck    # TypeScript 类型检查
npm test             # 单元测试（node:test）
npm run smoke        # 端到端冒烟（需先启动服务）
```

冒烟流程：会员登录 → 查询门店商品 → 创建订单 → 支付 → 店员推进状态 → 验证积分到账。

## 文档

- API 文档页：`http://127.0.0.1:3300/docs`（开发模式下）
- 错误码登记：[docs/errors.md](docs/errors.md)

## 已知问题

- 验证码固定为 123456，仅模拟用
- token 存于内存数据库，重启后需重新登录
- 数据库文件位于 `server/data/shanYe.db`（已 gitignore）
