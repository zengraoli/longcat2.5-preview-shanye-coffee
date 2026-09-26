package com.shanyecoffee.app.feature.checkout

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shanyecoffee.app.core.cart.CartManager
import com.shanyecoffee.app.core.ui.components.CupArt
import com.shanyecoffee.app.core.ui.components.ScreenTitleBar
import com.shanyecoffee.app.core.ui.components.StateViews
import com.shanyecoffee.app.core.ui.components.categoryCupColors
import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.Cream
import com.shanyecoffee.app.core.ui.theme.PriceLarge
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.TagOrangeBg
import com.shanyecoffee.app.core.ui.theme.Terracotta
import com.shanyecoffee.app.core.ui.theme.TextPrimary
import com.shanyecoffee.app.core.ui.theme.TextSecondary
import com.shanyecoffee.app.core.util.CouponDiscount
import com.shanyecoffee.app.core.util.PriceFormat

/**
 * 确认订单页（设计稿 AD4）
 * 自提 / 堂食、商品明细、默认选择最优优惠券、金额明细（原价 / 第二杯半价 / 优惠券 / 实付）、模拟支付。
 * 金额以 server 返回为准（下单后跳转的订单详情使用 server 数据）。
 */
@Composable
fun CheckoutScreen(
    onNeedLogin: () -> Unit = {},
    onPaySuccess: (orderId: Int) -> Unit = {},
    viewModel: CheckoutViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val cartLines by CartManager.lines.collectAsState()
    val orderType by CartManager.orderType.collectAsState()

    // 未登录时跳转登录页，登录成功后回到本页（popBackStack）
    LaunchedEffect(Unit) {
        if (!com.shanyecoffee.app.core.data.SessionManager.isLoggedIn) {
            onNeedLogin()
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Cream)) {
        Column(modifier = Modifier.fillMaxSize()) {
            ScreenTitleBar(title = "确认订单")

            if (state.loading) {
                StateViews.LoadingView()
            } else if (state.error != null && state.selectedStore == null) {
                StateViews.ErrorView(message = state.error ?: "加载失败", onRetry = viewModel::load)
            } else {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    // 门店与取餐方式
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White, RoundedCornerShape(Radii.card))
                            .padding(16.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = state.selectedStore?.name ?: "",
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = state.selectedStore?.let { store ->
                                        val statusText = if (store.status == "open") "营业中" else "休息中"
                                        "$statusText ${store.openTime}-${store.closeTime}"
                                    } ?: "",
                                    fontSize = 13.sp,
                                    color = TextSecondary,
                                )
                            }
                            TypeToggle(selected = orderType, onSelect = { CartManager.setOrderType(it) })
                        }
                    }

                    // 商品明细
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White, RoundedCornerShape(Radii.card))
                            .padding(16.dp),
                    ) {
                        Text(
                            text = "商品",
                            style = androidx.compose.material3.MaterialTheme.typography.titleMedium,
                            color = TextPrimary,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        cartLines.forEach { line ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                val (cupBg, liquid) = categoryCupColors(line.categoryId)
                                Box(
                                    modifier = Modifier
                                        .size(52.dp)
                                        .background(cupBg, RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    CupArt(
                                        modifier = Modifier.size(44.dp),
                                        cupBg = Color.Transparent,
                                        liquid = liquid,
                                    )
                                }
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(horizontal = 12.dp),
                                ) {
                                    Text(
                                        text = line.name,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextPrimary,
                                    )
                                    Text(
                                        text = "${cupLabel(line.cupSize)} · ${temperatureLabel(line.temperature)} · ${sugarLabel(line.sugar)} ×${line.quantity}",
                                        fontSize = 13.sp,
                                        color = TextSecondary,
                                    )
                                }
                                Text(
                                    text = PriceFormat.fenToYuan(line.unitPrice * line.quantity),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextPrimary,
                                )
                            }
                        }
                    }

                    // 优惠券（默认选择最优）
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White, RoundedCornerShape(Radii.card))
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                            .testTag("coupon_row"),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.ConfirmationNumber,
                            contentDescription = null,
                            tint = Terracotta,
                        )
                        Text(
                            text = "优惠券",
                            fontSize = 15.sp,
                            color = TextPrimary,
                            modifier = Modifier
                                .weight(1f)
                                .padding(start = 12.dp),
                        )
                        if (state.couponLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                color = Terracotta,
                                strokeWidth = 2.dp,
                            )
                        } else {
                            val coupon = state.bestCoupon
                            val couponDiscount = state.couponDiscount
                            Text(
                                text = if (coupon != null && couponDiscount > 0) {
                                    "${CouponDiscount.displayText(coupon.type, coupon.threshold, coupon.discount)}（已选最优）"
                                } else {
                                    "暂无可用优惠券"
                                },
                                fontSize = 13.sp,
                                color = if (coupon != null && couponDiscount > 0) Terracotta else TextSecondary,
                                modifier = Modifier.testTag("coupon_text"),
                            )
                            Icon(
                                imageVector = Icons.Filled.KeyboardArrowRight,
                                contentDescription = null,
                                tint = TextSecondary,
                            )
                        }
                    }

                    // 金额明细
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White, RoundedCornerShape(Radii.card))
                            .padding(16.dp),
                    ) {
                        AmountRow(label = "商品原价", value = PriceFormat.fenToYuan(state.originalTotal), bold = false)
                        if (state.promoDiscount > 0) {
                            AmountRow(
                                label = "第二杯半价",
                                value = "-${PriceFormat.fenToYuan(state.promoDiscount)}",
                                valueColor = Terracotta,
                            )
                        }
                        if (state.couponDiscount > 0) {
                            AmountRow(
                                label = "优惠券",
                                value = "-${PriceFormat.fenToYuan(state.couponDiscount)}",
                                valueColor = Terracotta,
                            )
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "实付",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary,
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                text = PriceFormat.fenToYuan(state.paidAmount),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                modifier = Modifier.testTag("paid_amount"),
                            )
                        }
                    }

                    if (state.error != null) {
                        Text(text = state.error ?: "", color = Terracotta, fontSize = 13.sp)
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }

        // 底部支付栏
        if (!state.loading && state.selectedStore != null && CartManager.itemCount > 0) {
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 20.dp, vertical = 12.dp)
                    .testTag("checkout_footer"),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = PriceFormat.fenToYuan(state.paidAmount),
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                    )
                    if (state.totalDiscount > 0) {
                        Text(
                            text = "已优惠 ${PriceFormat.fenToYuan(state.totalDiscount)}",
                            fontSize = 12.sp,
                            color = Terracotta,
                        )
                    }
                }
                Button(
                    onClick = { viewModel.submitOrder(onPaySuccess) },
                    modifier = Modifier
                        .heightIn(min = 48.dp)
                        .testTag("btn_pay"),
                    shape = RoundedCornerShape(Radii.pill),
                    enabled = !state.submitting,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandGreen,
                        contentColor = Color.White,
                    ),
                ) {
                    if (state.submitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp,
                        )
                    } else {
                        Text(text = "模拟支付", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun AmountRow(
    label: String,
    value: String,
    valueColor: Color = TextPrimary,
    bold: Boolean = false,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            color = TextSecondary,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
            color = valueColor,
        )
    }
}

@Composable
private fun TypeToggle(
    selected: String,
    onSelect: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .background(Cream, RoundedCornerShape(Radii.pill))
            .padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        TypeOption(
            label = "自提",
            selected = selected == CartManager.TYPE_PICKUP,
            onClick = { onSelect(CartManager.TYPE_PICKUP) },
        )
        TypeOption(
            label = "堂食",
            selected = selected == CartManager.TYPE_DINE_IN,
            onClick = { onSelect(CartManager.TYPE_DINE_IN) },
        )
    }
}

@Composable
private fun TypeOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .background(
                if (selected) BrandGreen else Color.Transparent,
                RoundedCornerShape(Radii.pill),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = if (selected) Color.White else TextSecondary,
        )
    }
}

private fun cupLabel(value: String): String = if (value == "medium") "中杯" else if (value == "large") "大杯" else value
private fun temperatureLabel(value: String): String = if (value == "hot") "热" else if (value == "iced") "冰" else value
private fun sugarLabel(value: String): String = if (value == "standard") "标准" else if (value == "less") "少糖" else if (value == "none") "无糖" else value
