# 山野咖啡 · Android 客户端

原生 Android（Kotlin 2.x + Jetpack Compose Material 3 + Navigation Compose + Retrofit/OkHttp + kotlinx.serialization + DataStore），单 Activity，底部导航四个 Tab（首页 / 点单 / 订单 / 我的）。

## 构建与运行

```bash
cd android
./gradlew assembleDebug          # Windows: gradlew.bat assembleDebug
```

安装到设备/模拟器：

```bash
./gradlew installDebug
```

## 接口对接

- 接口基地址写在 `BuildConfig.API_BASE_URL`，默认 `http://127.0.0.1:3300/api/`（server 接口统一挂在 `/api` 下，`app/build.gradle.kts`）。
- 真机调试：手机与电脑同一网络或用 `adb reverse tcp:3300 tcp:3300` 后访问本机 server。
- 已为 `127.0.0.1`、`localhost`、`10.0.2.2` 配置明文 HTTP 白名单（network security config）。
- 登录态保存在 DataStore；接口返回未登录（1002/1003）时统一跳转登录页。

## Deep Link

`shanye://<页面>` 可直接打开对应页面（测试用）：

```bash
adb shell am start -a android.intent.action.VIEW -d "shanye://home"
```

支持页面：`login`、`home`、`order`、`checkout`、`orders`、`profile`。

## 测试

```bash
./gradlew testDebugUnitTest        # 单元测试
./gradlew recordRoborazziDebug     # Roborazzi 截图测试（截图输出到 android/screenshots/）
```

## 已知问题

- 商品图与插画均为自绘（Canvas），不使用外部图片。
- 演示环境验证码固定为 123456。
