# 山野咖啡 · Android 客户端

原生 Android（Kotlin 2.x + Jetpack Compose Material 3 + Navigation Compose + Retrofit/OkHttp + kotlinx.serialization + DataStore），单 Activity，底部导航四个 Tab（首页 / 点单 / 订单 / 我的）。

## 构建与安装

```bash
cd android
./gradlew assembleDebug          # Windows: gradlew.bat assembleDebug
./gradlew installDebug           # 安装到已连接的设备/模拟器
```

安装包输出：`app/build/outputs/apk/debug/app-debug.apk`。

## 接口对接

- 接口基地址写在 `BuildConfig.API_BASE_URL`，默认 `http://127.0.0.1:3300/api/`（server 接口统一挂在 `/api` 下，`app/build.gradle.kts`）。
- 真机调试：手机与电脑同一网络或用 `adb reverse tcp:3300 tcp:3300` 后访问本机 server：

```bash
adb reverse tcp:3300 tcp:3300
```

- 已为 `127.0.0.1`、`localhost`、`10.0.2.2` 配置明文 HTTP 白名单（network security config）。
- 登录态保存在 DataStore；接口返回未登录（1002/1003）时统一跳转登录页，登录后回到原页面。

## Deep Link

`shanye://<页面>` 可直接打开对应页面（测试用）：

```bash
adb shell am start -a android.intent.action.VIEW -d "shanye://home"
```

支持页面：`login`、`home`、`order`、`checkout`、`orders`、`profile`。

## 测试

```bash
./gradlew testDebugUnitTest        # 单元测试
./gradlew recordRoborazziDebug     # Roborazzi 截图测试（需 --rerun-tasks 强制重跑）
```

截图测试用 Robolectric + Compose 以演示数据渲染 6 个页面（登录、首页、点单、确认订单、订单详情、我的），运行 `recordRoborazziDebug` 后截图输出到 `android/screenshots/`：

```bash
./gradlew recordRoborazziDebug --rerun-tasks
```

> 注意：`recordRoborazziDebug` 依赖的 test 任务若被判定 UP-TO-DATE 不会实际执行，需要 `--rerun-tasks`（或先 `cleanTestDebugUnitTest`）才能生成新截图。

## 已知问题

- 商品图与插画均为自绘（Canvas / 图标），不使用外部图片。
- 演示环境验证码固定为 123456。
- 开发机访问外网需要代理时，通过 `GRADLE_OPTS="-Dhttp.proxyHost=... -Dhttp.proxyPort=... -Dhttps.proxyHost=... -Dhttps.proxyPort=..."` 传递；测试访问本机 server 已配置 nonProxyHosts 绕过。
