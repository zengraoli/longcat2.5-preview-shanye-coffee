package com.shanyecoffee.app.feature.orderdetail

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
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
import com.shanyecoffee.app.core.data.SessionManager
import com.shanyecoffee.app.core.ui.components.ScreenTitleBar
import com.shanyecoffee.app.core.ui.components.StateViews
import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.Gold
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.TagOrangeBg
import com.shanyecoffee.app.core.ui.theme.Terracotta
import com.shanyecoffee.app.core.ui.theme.TextPrimary
import com.shanyecoffee.app.core.ui.theme.TextSecondary
import com.shanyecoffee.app.core.util.OrderStatus
import com.shanyecoffee.app.core.util.PriceFormat
import com.shanyecoffee.app.core.util.TimeFormat

/**
 * 订单详情页（设计稿 AD5）
 * 取餐码、订单进度（已支付 / 制作中 / 待取餐 / 已完成）、订单信息、取餐提示。
 */
@Composable
fun OrderDetailScreen(
    orderId: Int,
    onBack: () -> Unit = {},
) {
    val viewModel: OrderDetailViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
        key = "order_detail_$orderId",
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return OrderDetailViewModel(orderId) as T
            }
        },
    )
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        if (!SessionManager.isLoggedIn) {
            onBack()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(androidx.compose.ui.graphics.Color(0xFFFAF6ED)),
    ) {
        ScreenTitleBar(title = "订单详情", onBack = onBack)

        if (state.loading) {
            StateViews.LoadingView()
        } else if (state.error != null || state.order == null) {
            StateViews.ErrorView(message = state.error ?: "订单不存在", onRetry = viewModel::load)
        } else {
            val order = state.order!!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                // 取餐码卡片
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BrandGreen, RoundedCornerShape(Radii.card))
                        .padding(vertical = 24.dp)
                        .testTag("pickup_card"),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(text = "取餐码", fontSize = 14.sp, color = Color.White)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = order.pickupCode,
                        fontSize = 52.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        letterSpacing = 8.sp,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = OrderStatus.pickupSubtitle(order.status, order.paidAt),
                        fontSize = 14.sp,
                        color = Color(0xFFF5D9B8),
                    )
                }

                // 订单进度
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White, RoundedCornerShape(Radii.card))
                        .padding(16.dp),
                ) {
                    Text(
                        text = "订单进度",
                        style = androidx.compose.material3.MaterialTheme.typography.titleMedium,
                        color = TextPrimary,
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    ProgressSteps(status = order.status)
                }

                // 订单信息
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White, RoundedCornerShape(Radii.card))
                        .padding(16.dp),
                ) {
                    InfoRow(label = "订单号", value = order.orderNo)
                    InfoRow(label = "门店", value = order.storeName)
                    InfoRow(label = "下单时间", value = TimeFormat.isoToBeijingDateTime(order.createdAt))
                    InfoRow(label = "取餐方式", value = OrderStatus.typeLabel(order.type))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "实付",
                            fontSize = 14.sp,
                            color = TextSecondary,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            text = PriceFormat.fenToYuan(order.paidAmount),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                        )
                    }
                }

                // 取餐提示
                Text(
                    text = "做好后会通知你，凭取餐码到柜台领取",
                    fontSize = 13.sp,
                    color = Terracotta,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(TagOrangeBg, RoundedCornerShape(Radii.thumb))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                )

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun ProgressSteps(status: String) {
    val current = OrderStatus.progressIndex(status)
    val steps = listOf("已支付", "制作中", "待取餐", "已完成")
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        steps.forEachIndexed { index, label ->
            val done = current in 0..index && current >= 0
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.testTag("step_$label"),
            ) {
                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .background(
                            if (done) Terracotta else Color(0xFFE3DCCB),
                            CircleShape,
                        ),
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = label,
                    fontSize = 12.sp,
                    color = if (done) Terracotta else TextSecondary,
                )
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
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
            color = TextPrimary,
        )
    }
}
