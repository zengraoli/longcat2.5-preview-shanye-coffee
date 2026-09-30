# android · 山野咖啡 Android 客户端

Kotlin 2.x + Jetpack Compose（Material 3）+ Navigation Compose + Retrofit/OkHttp + kotlinx.serialization + DataStore。单 Activity，minSdk 26，targetSdk 35。

## 构建与安装

```bash
# 构建 debug APK
./gradlew assembleDebug          # Windows: gradlew.bat assembleDebug

# 安装到设备/模拟器
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 真机调试

接口基地址默认 `http://127.0.0.1:3300`（BuildConfig）。真机通过 `adb reverse` 访问本机 server：

```bash
adb reverse tcp:3300 tcp:3300
```

已配置 network_security_config 允许 `127.0.0.1`、`10.0.2.2`、`localhost` 的明文 HTTP。

## Deep Link

支持 `shanye://<页面>` 直接打开对应页面：

```bash
adb shell am start -a android.intent.action.VIEW -d "shanye://home"
adb shell am start -a android.intent.action.VIEW -d "shanye://order"
adb shell am start -a android.intent.action.VIEW -d "shanye://checkout"
adb shell am start -a android.intent.action.VIEW -d "shanye://orders"
adb shell am start -a android.intent.action.VIEW -d "shanye://profile"
adb shell am start -a android.intent.action.VIEW -d "shanye://login"
```

## 测试

```bash
# 单元测试（金额格式化、价格展示等）
./gradlew testDebugUnitTest

# Roborazzi 截图测试（6 个页面）
./gradlew recordRoborazziDebug
```

截图输出到 `app/screenshots/`。

## 页面

| 页面 | 路由 | 说明 |
|-|-|-|
| 登录 | login | 手机号 + 验证码（固定 123456），首次登录自动注册 |
| 首页 | home | 门店选择与营业状态、活动横幅、自提/堂食入口、当季推荐 |
| 点单 | order | 分类 Tab、商品列表、规格底部弹窗、售罄状态、购物车条（含第二杯半价） |
| 确认订单 | checkout | 自提/堂食、商品明细、默认最优优惠券、金额明细、模拟支付 |
| 订单详情 | orderDetail/{id} | 取餐码、进度、订单信息、商品清单 |
| 订单列表 | orders | 订单列表，下拉刷新可见后台推进的最新状态 |
| 我的 | profile | 会员卡、积分与等级进度、优惠券/订单/积分统计、退出登录 |

## 技术要点

- 品牌主题见 `ui/theme/`（Color.kt / Theme.kt / Type.kt），与 web / admin / miniapp 共用品牌色。
- 金额一律整数“分”，界面用 `formatYuan` 格式化为 `¥xx.xx`。
- 时间一律 UTC ISO8601，界面用 `formatBeijing` 按北京时间显示。
- 手机号脱敏 `138****1234`。
- 网络层用 Retrofit + kotlinx.serialization，统一解析 `{"code":0,"data":..,"message":"ok"}`。
- 登录态用 DataStore 保存，接口返回未登录（1003/2004）时清除会话并跳转登录页。
- 商品插画为自绘图标（ProductArt），不依赖外部图片。

## 已知问题

- 支付为模拟支付，无真实支付渠道。
- 验证码固定 123456，仅模拟短信。
- 活动类型目前固定为「第二杯半价」。
