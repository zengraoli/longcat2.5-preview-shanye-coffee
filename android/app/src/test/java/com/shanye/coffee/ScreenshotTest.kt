package com.shanye.coffee

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.assertIsDisplayed
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.shanye.coffee.data.Category
import com.shanye.coffee.data.Coupon
import com.shanye.coffee.data.CreateOrderRequest
import com.shanye.coffee.data.LevelInfo
import com.shanye.coffee.data.Member
import com.shanye.coffee.data.Order
import com.shanye.coffee.data.OrderItem
import com.shanye.coffee.data.OrderItemRequest
import com.shanye.coffee.data.Product
import com.shanye.coffee.data.ProductSpec
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.SessionStore
import com.shanye.coffee.data.Store
import com.shanye.coffee.data.ActivePromotions
import com.shanye.coffee.data.Promotion
import com.shanye.coffee.ui.screens.CheckoutScreen
import com.shanye.coffee.ui.screens.HomeScreen
import com.shanye.coffee.ui.screens.LoginScreen
import com.shanye.coffee.ui.screens.OrderDetailScreen
import com.shanye.coffee.ui.screens.OrderScreen
import com.shanye.coffee.ui.screens.OrdersScreen
import com.shanye.coffee.ui.screens.ProfileScreen
import com.shanye.coffee.ui.theme.ShanyeCoffeeTheme
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import com.github.takahirom.roborazzi.captureRoboImage
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * Roborazzi 截图测试：用演示数据渲染 6 个页面并截图。
 * 运行 `gradlew recordRoborazziDebug` 生成截图到 android/screenshots/。
 */
@RunWith(AndroidJUnit4::class)
@Config(sdk = [35], manifest = "AndroidManifest.xml")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScreenshotTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    private val sessionStore = SessionStore(ApplicationProvider.getApplicationContext())

    /** 演示数据仓库：不依赖 server */
    private val fakeRepository = object : Repository(sessionStore) {
        override suspend fun stores() = listOf(
            Store(1, "山野咖啡·望京店", "北京市朝阳区望京SOHO T1 座 101", "010-64700001", "08:00", "21:00", "open", true),
            Store(2, "山野咖啡·三里屯店", "北京市朝阳区三里屯太古里南区 N4-30", "010-64700002", "08:30", "22:00", "open", true),
        )
        override suspend fun categories() = listOf(
            Category(1, "咖啡"), Category(2, "茶饮"), Category(3, "轻食"), Category(4, "周边"),
        )
        override suspend fun products() = listOf(
            Product(1, 1, "桂花拿铁", "桂花乌龙酱 · 双份浓缩 · 燕麦奶", 2800, null, false,
                listOf(ProductSpec("medium", "ice", "standard", 0), ProductSpec("large", "ice", "standard", 300))),
            Product(2, 1, "焦糖栗子拿铁", "秋栗泥 · 焦糖 · 鲜牛奶", 3000, null, false,
                listOf(ProductSpec("medium", "hot", "standard", 0))),
            Product(3, 2, "山野生椰", "海南生椰乳 · 云南小粒", 2600, null, false,
                listOf(ProductSpec("medium", "ice", "standard", 0))),
            Product(4, 1, "冷萃·高山日晒", "云南保山 · 12 小时冷萃", 2400, null, true,
                listOf(ProductSpec("medium", "ice", "standard", 0))),
            Product(5, 3, "火腿芝士可颂", "现烤", 2200, null, false),
        )
        override suspend fun activePromotions() = ActivePromotions(
            listOf(Promotion(1, "第二杯半价", "second_cup_half", "2026-09-01T00:00:00Z", "2026-09-30T23:59:59Z")),
            listOf(1, 2, 3, 4),
        )
        override suspend fun orders() = listOf(
            Order(1, "SY20260926196191", 1, "pickup", "making", "8604", 8400, 1550, 1000, 5850, null, "2026-09-26T14:32:00Z", "2026-09-26T14:33:00Z", null,
                listOf(OrderItem(1, 1, "桂花拿铁", "large", "ice", "less", 3100, 2), OrderItem(2, 5, "火腿芝士可颂", null, null, null, 2200, 1))),
        )
        override suspend fun order(id: Int) = orders().first()
        override suspend fun me() = Member(1, "13800001234", "山野会员1234", 1286, LevelInfo("gold", "金卡", 1286, "black", 714))
        override suspend fun myCoupons() = listOf(
            Coupon(1, 1, "满100减20券", "full_reduction", 10000, 2000, null, "unused", "2099-01-01T00:00:00Z", true),
        )
        override suspend fun createOrder(request: CreateOrderRequest) = Order(2, "SY20260926196192", 1, "pickup", "pending_payment", "1234", 8400, 1550, 1000, 5850, null, "2026-09-26T15:00:00Z", null, null, emptyList())
        override suspend fun pay(id: Int) = order(id).copy(status = "paid", paidAt = "2026-09-26T15:01:00Z")
        override suspend fun cancel(id: Int) = order(id).copy(status = "cancelled", cancelledAt = "2026-09-26T15:02:00Z")
    }

    @Test
    fun loginScreen() {
        composeRule.setContent {
            ShanyeCoffeeTheme {
                LoginScreen(repository = fakeRepository, sessionStore = sessionStore, onLoggedIn = {})
            }
        }
        composeRule.onNodeWithText("山野咖啡").assertExists()
        composeRule.onNodeWithText("登录 / 注册").assertExists()
        composeRule.onRoot().captureRoboImage()
    }

    @Test
    fun homeScreen() {
        composeRule.setContent {
            ShanyeCoffeeTheme {
                HomeScreen(repository = fakeRepository, onGoToOrder = {}, onGoToMenu = {})
            }
        }
        composeRule.onNodeWithText("当季推荐").assertExists()
        composeRule.onRoot().captureRoboImage()
    }

    @Test
    fun orderScreen() {
        composeRule.setContent {
            ShanyeCoffeeTheme {
                OrderScreen(repository = fakeRepository, onGoToCheckout = {})
            }
        }
        composeRule.onNodeWithText("点单").assertExists()
        composeRule.onRoot().captureRoboImage()
    }

    @Test
    fun checkoutScreen() {
        composeRule.setContent {
            ShanyeCoffeeTheme {
                CheckoutScreen(repository = fakeRepository, onPaid = {})
            }
        }
        composeRule.onNodeWithText("确认订单").assertExists()
        composeRule.onRoot().captureRoboImage()
    }

    @Test
    fun orderDetailScreen() {
        composeRule.setContent {
            ShanyeCoffeeTheme {
                OrderDetailScreen(repository = fakeRepository, orderId = 1, onBack = {})
            }
        }
        composeRule.onNodeWithText("订单详情").assertExists()
        composeRule.onRoot().captureRoboImage()
    }

    @Test
    fun ordersScreen() {
        composeRule.setContent {
            ShanyeCoffeeTheme {
                OrdersScreen(repository = fakeRepository, onGoToDetail = {}, onGoToOrder = {})
            }
        }
        composeRule.onRoot().captureRoboImage()
    }

    @Test
    fun profileScreen() {
        composeRule.setContent {
            ShanyeCoffeeTheme {
                ProfileScreen(repository = fakeRepository, sessionStore = sessionStore, onGoToOrders = {}, onGoToOrder = {}, onLoggedOut = {})
            }
        }
        composeRule.onRoot().captureRoboImage()
    }
}
