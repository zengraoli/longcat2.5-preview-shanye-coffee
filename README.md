# 山野咖啡点单平台

四端完整项目：API 服务、后台管理、品牌官网、点单小程序。

## 子项目

| 子项目 | 技术栈 | 端口 | README |
|---|---|---|---|
| server | Node.js 24 + TypeScript + Fastify + SQLite | 3300 | [server/README.md](server/README.md) |
| admin | React 19 + Vite + TS + Tailwind v4 + Recharts | 5301 | [admin/README.md](admin/README.md) |
| web | Vue 3 + Vite + TypeScript | 5302 | [web/README.md](web/README.md) |
| miniapp | uni-app Vue 3 + Vite（编译到 mp-weixin） | 5303 (H5) | [miniapp/README.md](miniapp/README.md) |

## 默认账号

| 端 | 账号 | 密码/验证码 |
|---|---|---|
| 管理员 | admin | admin123 |
| 店员 | staff01 | staff123 |
| 会员 | 任意 11 位手机号 | 验证码固定 123456（模拟） |

## 全局约定

- API 统一返回 `{"code": 0, "data": ..., "message": "ok"}`；出错时 code 非 0，message 为中文
- 金额用整数"分"存储和传输，界面格式化为 ¥xx.xx
- 时间用 UTC ISO8601 存储和传输，界面按北京时间显示
- 手机号在列表、日志、非本人接口中脱敏为 138****1234
- 不依赖外部图片或 CDN，插画和图标自绘（SVG / CSS）
- 三个前端共用品牌视觉（主色 #8B4513），主题变量写在各端主题文件中

## 已知问题

- 验证码固定为 123456，仅模拟用
- 小程序商品图暂用文字占位（不依赖外部图片）
- 小程序 tabBar 图标需自行放入 src/static/tab/ 目录
- 后台商品管理页缺少图片上传功能，商品图暂用文字展示
- admin 构建产物较大（含 Recharts），可后续做代码分割优化
- 小程序登录页为占位页面，完整登录流程待后续完善
- 门店导航链接指向百度地图搜索（非原生地图组件）
- 积分无过期机制，仅累计不清零
- 第二杯半价活动仅支持一个活动同时生效
