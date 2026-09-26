package com.shanyecoffee.app.screenshot

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import com.shanyecoffee.app.core.api.ActivePromotionDto
import com.shanyecoffee.app.core.api.BestCouponDto
import com.shanyecoffee.app.core.api.CategoryDto
import com.shanyecoffee.app.core.api.OrderDetailDto
import com.shanyecoffee.app.core.api.OrderItemDto
import com.shanyecoffee.app.core.api.ProductDto
import com.shanyecoffee.app.core.api.StoreDto
import com.shanyecoffee.app.core.cart.CartManager
import com.shanyecoffee.app.core.ui.theme.ShanYeTheme
import com.shanyecoffee.app.feature.checkout.CheckoutContent
import com.shanyecoffee.app.feature.checkout.CheckoutUiState
import com.shanyecoffee.app.feature.home.HomeContent
import com.shanyecoffee.app.feature.home.HomeUiState
import com.shanyecoffee.app.feature.login.LoginScreen
import com.shanyecoffee.app.feature.order.OrderContent
import com.shanyecoffee.app.feature.order.OrderUiState
import com.shanyecoffee.app.feature.orderdetail.OrderDetailContent
import com.shanyecoffee.app.feature.profile.ProfileContent
import com.shanyecoffee.app.feature.profile.ProfileUiState
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/**
 * 6 个页面的 Roborazzi 截图测试（Robolectric + Compose，演示数据渲染）。
 * 运行 ./gradlew recordRoborazziDebug 后截图输出到 android/screenshots/。
 */
@RunWith(AndroidJUnit4::class)
@Config(qualifiers = "w360dp-h800dp-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ShanYeScreenshotTests {

    @get:Rule
    val composeRule = createComposeRule()

    @Before
    fun setUp() {
        CartManager.clear()
        CartManager.setOrderType(CartManager.TYPE_PICKUP)
    }

    @Test
    fun ad1Login() {
        composeRule.setContent {
            ShanYeTheme {
                LoginScreen(onLoginSuccess = {})
            }
        }
        composeRule.onRoot().captureRoboImage("AD1-login.png")
    }

    @Test
    fun ad2Home() {
        composeRule.setContent {
            ShanYeTheme {
                HomeContent(
                    state = HomeUiState(
                        loading = false,
                        stores = demoStores,
                        selectedStoreId = 1,
                        promotion = demoPromotion,
                    ),
                    onGoToOrder = {},
                )
            }
        }
        composeRule.onRoot().captureRoboImage("AD2-home.png")
    }

    @Test
    fun ad3Order() {
        CartManager.add(
            CartManager.Line(
                productId = 2,
                categoryId = 1,
                name = "拿铁",
                cupSize = "medium",
                temperature = "hot",
                sugar = "standard",
                quantity = 2,
                unitPrice = 2800,
            ),
        )
        composeRule.setContent {
            ShanYeTheme {
                OrderContent(
                    state = OrderUiState(
                        loading = false,
                        categories = demoCategories,
                        products = demoProducts,
                        promoProductIds = setOf(1, 2, 3),
                        selectedCategoryId = 1,
                    ),
                    cartLines = CartManager.lines.value,
                    orderType = CartManager.TYPE_PICKUP,
                    onGoToCheckout = {},
                )
            }
        }
        composeRule.onRoot().captureRoboImage("AD3-order.png")
    }

    @Test
    fun ad4Checkout() {
        CartManager.add(
            CartManager.Line(
                productId = 2,
                categoryId = 1,
                name = "拿铁",
                cupSize = "large",
                temperature = "iced",
                sugar = "less",
                quantity = 2,
                unitPrice = 3100,
            ),
        )
        CartManager.add(
            CartManager.Line(
                productId = 23,
                categoryId = 3,
                name = "火腿芝士可颂",
                cupSize = "medium",
                temperature = "hot",
                sugar = "standard",
                quantity = 1,
                unitPrice = 2200,
            ),
        )
        composeRule.setContent {
            ShanYeTheme {
                CheckoutContent(
                    state = CheckoutUiState(
                        loading = false,
                        stores = demoStores,
                        selectedStoreId = 1,
                        promoProductIds = setOf(1, 2, 3),
                        bestCoupon = BestCouponDto(
                            userCouponId = 101,
                            couponId = 1,
                            name = "满 50 减 10 券",
                            type = "fixed",
                            threshold = 5000,
                            discount = 1000,
                        ),
                    ),
                    cartLines = CartManager.lines.value,
                    orderType = CartManager.TYPE_PICKUP,
                    onPay = {},
                )
            }
        }
        composeRule.onRoot().captureRoboImage("AD4-checkout.png")
    }

    @Test
    fun ad5OrderDetail() {
        composeRule.setContent {
            ShanYeTheme {
                OrderDetailContent(order = demoOrderDetail, onBack = {})
            }
        }
        composeRule.onRoot().captureRoboImage("AD5-order-detail.png")
    }

    @Test
    fun ad6Profile() {
        composeRule.setContent {
            ShanYeTheme {
                ProfileContent(
                    state = ProfileUiState(
                        loading = false,
                        phone = "138****1234",
                        points = 1286,
                        couponCount = 3,
                        orderCount = 12,
                    ),
                    onGoToOrders = {},
                )
            }
        }
        composeRule.onRoot().captureRoboImage("AD6-profile.png")
    }

    companion object {
        val demoStores = listOf(
            StoreDto(
                id = 1,
                name = "西溪印象城店",
                address = "西湖区西溪印象城 L2-08",
                phone = "138****0001",
                openTime = "07:30",
                closeTime = "21:00",
                status = "open",
            ),
            StoreDto(
                id = 2,
                name = "山野咖啡 · 望京SOHO店",
                address = "朝阳区望京SOHO T1-1201",
                phone = "138****0002",
                openTime = "07:30",
                closeTime = "21:00",
                status = "open",
            ),
        )

        val demoPromotion = ActivePromotionDto(
            id = 1,
            name = "第二杯半价",
            startTime = "2026-09-19T00:00:00Z",
            endTime = "2026-09-30T23:59:59Z",
            productIds = listOf(1, 2),
            products = listOf(
                ProductDto(
                    id = 1,
                    categoryId = 1,
                    name = "桂花拿铁",
                    description = "桂花乌龙酱 · 双份浓缩 · 燕麦奶",
                    price = 2800,
                    soldOut = false,
                ),
                ProductDto(
                    id = 2,
                    categoryId = 1,
                    name = "山野生椰",
                    description = "海南生椰乳 · 云南小粒",
                    price = 2600,
                    soldOut = false,
                ),
            ),
        )

        val demoCategories = listOf(
            CategoryDto(id = 1, name = "咖啡", sortOrder = 1),
            CategoryDto(id = 2, name = "茶饮", sortOrder = 2),
            CategoryDto(id = 3, name = "轻食", sortOrder = 3),
            CategoryDto(id = 4, name = "周边", sortOrder = 4),
        )

        val demoProducts = listOf(
            ProductDto(
                id = 1,
                categoryId = 1,
                name = "桂花拿铁",
                description = "桂花乌龙酱 · 双份浓缩 · 燕麦奶",
                price = 2800,
                soldOut = false,
            ),
            ProductDto(
                id = 2,
                categoryId = 1,
                name = "焦糖栗子拿铁",
                description = "秋栗泥 · 焦糖 · 鲜牛奶",
                price = 3000,
                soldOut = false,
            ),
            ProductDto(
                id = 3,
                categoryId = 1,
                name = "山野生椰",
                description = "海南生椰乳 · 云南小粒",
                price = 2600,
                soldOut = false,
            ),
            ProductDto(
                id = 4,
                categoryId = 1,
                name = "冷萃 · 高山日晒",
                description = "云南保山 · 12 小时冷萃",
                price = 2400,
                soldOut = true,
            ),
        )

        val demoOrderDetail = OrderDetailDto(
            id = 11,
            orderNo = "SY20260926196191",
            pickupCode = "8604",
            type = "pickup",
            status = "making",
            originalAmount = 8400,
            discountAmount = 2550,
            paidAmount = 5850,
            pointsEarned = 58,
            promoDiscount = 1550,
            createdAt = "2026-09-26T06:32:00Z",
            paidAt = "2026-09-26T06:33:00Z",
            cancelledAt = null,
            storeId = 1,
            storeName = "西溪印象城店",
            items = listOf(
                OrderItemDto(
                    id = 1,
                    productId = 2,
                    productName = "拿铁",
                    cupSize = "large",
                    temperature = "iced",
                    sugar = "less",
                    quantity = 2,
                    unitPrice = 3100,
                ),
                OrderItemDto(
                    id = 2,
                    productId = 23,
                    productName = "火腿芝士可颂",
                    cupSize = "medium",
                    temperature = "hot",
                    sugar = "standard",
                    quantity = 1,
                    unitPrice = 2200,
                ),
            ),
        )
    }
}
