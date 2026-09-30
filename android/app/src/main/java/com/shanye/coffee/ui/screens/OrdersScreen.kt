package com.shanye.coffee.ui.screens

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shanye.coffee.data.Order
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.formatBeijing
import com.shanye.coffee.data.formatYuan
import com.shanye.coffee.data.orderStatusText
import com.shanye.coffee.ui.theme.Brand100
import com.shanye.coffee.ui.theme.Brand600
import com.shanye.coffee.ui.theme.Brand900
import com.shanye.coffee.ui.theme.Caramel600
import com.shanye.coffee.ui.theme.Cream50
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    repository: Repository,
    onGoToDetail: (Int) -> Unit,
    onGoToOrder: () -> Unit,
) {
    var orders by remember { mutableStateOf<List<Order>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var refreshing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    suspend fun load() {
        try {
            orders = repository.orders()
        } finally {
            loading = false
            refreshing = false
        }
    }

    LaunchedEffect(Unit) { load() }

    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = {
            refreshing = true
            scope.launch { load() }
        },
        modifier = Modifier.fillMaxSize().background(Cream50),
    ) {
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Brand600)
            }
        } else if (orders.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("暂无订单", fontSize = 16.sp, color = Color(0xFF8A968D))
                    Spacer(Modifier.height(12.dp))
                    Card(
                        modifier = Modifier.clickable { onGoToOrder() },
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Brand600),
                    ) {
                        Text("去点单", color = Cream50, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 32.dp, vertical = 12.dp))
                    }
                }
            }
        } else {
            LazyColumn(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(orders) { o ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onGoToDetail(o.id) },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(o.orderNo, fontSize = 13.sp, color = Color(0xFF8A968D))
                                Spacer(Modifier.weight(1f))
                                Text(
                                    orderStatusText(o.status),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = when (o.status) {
                                        "cancelled" -> Color(0xFFB0483E)
                                        "completed" -> Brand600
                                        else -> Caramel600
                                    },
                                )
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(
                                o.items.joinToString("、") { "${it.productName}×${it.quantity}" },
                                fontSize = 14.sp,
                                color = Brand900,
                            )
                            Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(formatBeijing(o.createdAt), fontSize = 12.sp, color = Color(0xFF8A968D))
                                Spacer(Modifier.weight(1f))
                                Text(formatYuan(o.payableAmount), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Brand900)
                            }
                        }
                    }
                }
            }
        }
    }
}
