package com.shanyecoffee.app.feature.orders

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
import com.shanyecoffee.app.core.api.OrderListDto
import com.shanyecoffee.app.core.data.SessionManager
import com.shanyecoffee.app.core.ui.components.StateViews
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.TagOrangeBg
import com.shanyecoffee.app.core.ui.theme.TextPrimary
import com.shanyecoffee.app.core.ui.theme.TextSecondary
import com.shanyecoffee.app.core.util.OrderStatus
import com.shanyecoffee.app.core.util.PriceFormat
import com.shanyecoffee.app.core.util.TimeFormat

/**
 * 订单列表页：支持下拉刷新，后台推进状态后刷新可见最新状态。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    onGoToDetail: (orderId: Int) -> Unit = {},
    onNeedLogin: () -> Unit = {},
    viewModel: OrdersViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        if (!SessionManager.isLoggedIn) {
            onNeedLogin()
        }
    }

    if (state.loading) {
        StateViews.LoadingView()
    } else if (state.error != null && state.orders.isEmpty()) {
        StateViews.ErrorView(message = state.error ?: "加载失败", onRetry = viewModel::load)
    } else {
        PullToRefreshBox(
            isRefreshing = state.refreshing,
            onRefresh = viewModel::refresh,
            modifier = Modifier.fillMaxSize(),
        ) {
            if (state.orders.isEmpty()) {
                StateViews.EmptyView(text = "暂无订单")
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .testTag("orders_list"),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(state.orders, key = { it.id }) { order ->
                        OrderCard(
                            order = order,
                            onClick = { onGoToDetail(order.id) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun OrderCard(
    order: OrderListDto,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(Radii.card))
            .clickable(onClick = onClick)
            .padding(16.dp)
            .testTag("order_card_${order.id}"),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = order.orderNo,
                fontSize = 14.sp,
                color = TextSecondary,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = OrderStatus.label(order.status),
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = OrderStatus.tagColor(order.status),
                modifier = Modifier
                    .background(TagOrangeBg, RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 3.dp),
            )
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = order.storeName,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = TimeFormat.isoToBeijingShort(order.createdAt),
                fontSize = 13.sp,
                color = TextSecondary,
            )
        }
        HorizontalDivider(color = Color(0xFFF3EDE2))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "实付 ",
                fontSize = 13.sp,
                color = TextSecondary,
            )
            Text(
                text = PriceFormat.fenToYuan(order.paidAmount),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = OrderStatus.typeLabel(order.type),
                fontSize = 12.sp,
                color = TextSecondary,
            )
        }
    }
}
