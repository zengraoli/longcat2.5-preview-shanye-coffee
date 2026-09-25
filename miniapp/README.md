# 山野咖啡点单小程序

uni-app（Vue 3 + Vite），编译到微信小程序（mp-weixin）。

## 启动

```bash
npm install
npm run dev:mp-weixin        # 编译到 mp-weixin（开发模式，watch）
npm run build:mp-weixin      # 编译到 mp-weixin（生产构建）
npm run dev:h5                # H5 调试（端口 5303）
npm run build:h5              # H5 生产构建
```

## 微信开发者工具导入

构建完成后，打开微信开发者工具，选择「导入项目」，目录选择：

```
dist/build/mp-weixin
```

AppID 可使用测试号，或替换为正式 AppID（在 `src/manifest.json` 中配置）。

## 接口配置

接口基地址在 `src/utils/request.ts` 中配置，默认 `http://127.0.0.1:3300`。

## 会员登录

手机号 + 验证码登录，验证码固定 `123456`（模拟）。

## 已知问题

- 不依赖外部图片，商品图暂用 SVG 占位
- tabBar 图标需要自行放入 `src/static/tab/` 目录
