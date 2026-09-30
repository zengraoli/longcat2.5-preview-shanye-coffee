package com.shanye.coffee.ui.screens

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shanye.coffee.data.Order
import com.shanye.coffee.data.AuthState
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.formatBeijing
import com.shanye.coffee.data.formatYuan
import com.shanye.coffee.data.orderStatusText
import com.shanye.coffee.data.specText
import com.shanye.coffee.ui.components.ProductArt
import com.shanye.coffee.ui.theme.Brand100
import com.shanye.coffee.ui.theme.Brand600
import com.shanye.coffee.ui.theme.Brand900
import com.shanye.coffee.ui.theme.Caramel600
import com.shanye.coffee.ui.theme.Cream50

@Composable
fun OrderDetailScreen(
    repository: Repository,
    orderId: Int,
    onBack: () -> Unit,
) {
    var order by remember { mutableStateOf<Order?>(null) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(orderId) {
        try {
            order = repository.order(orderId)
        } catch (e: com.shanye.coffee.data.UnauthorizedException) {
            AuthState.onUnauthorized()
        } catch (e: Exception) {
            // 忽略其他错误
        } finally {
            loading = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream50),
    ) {
        // 标题栏
        Row(
            modifier = Modifier.fillMaxWidth().padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回", tint = Brand900)
            }
            Text("订单详情", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Brand900)
        }

        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Brand600)
            }
            return@Column
        }

        val o = order ?: return@Column

        // 取餐码（仅自提且未取消）
        if (o.type == "pickup" && o.pickupCode != null && o.status != "cancelled") {
            Card(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Brand600),
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text("取餐码", fontSize = 13.sp, color = Cream50)
                    Text(o.pickupCode, fontSize = 48.sp, fontWeight = FontWeight.Bold, color = Cream50)
                    Text("${orderStatusText(o.status)} · 预计 6 分钟后可取", fontSize = 13.sp, color = Cream50)
                }
            }
        }

        // 订单进度
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("订单进度", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                Spacer(Modifier.height(16.dp))
                val steps = listOf("已支付", "制作中", "待取餐", "已完成")
                val currentStep = when (o.status) {
                    "paid" -> 0; "making" -> 1; "ready" -> 2; "completed" -> 3; else -> -1
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    steps.forEachIndexed { index, label ->
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(20.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (o.status == "cancelled") Color(0xFFB0483E)
                                        else if (index <= currentStep) Caramel600
                                        else Color(0xFFE0EDE2)
                                    ),
                            )
                            Spacer(Modifier.height(6.dp))
                            Text(
                                label,
                                fontSize = 11.sp,
                                color = if (o.status == "cancelled") Color(0xFFB0483E)
                                else if (index <= currentStep) Brand900
                                else Color(0xFF8A968D),
                            )
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // 订单信息
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                InfoRow("订单号", o.orderNo)
                InfoRow("门店", "山野咖啡·望京店")
                InfoRow("下单时间", formatBeijing(o.createdAt))
                InfoRow("取餐方式", if (o.type == "pickup") "自提" else "堂食")
                InfoRow("实付", formatYuan(o.payableAmount))
            }
        }

        Spacer(Modifier.height(12.dp))

        // 商品清单
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("商品清单", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                Spacer(Modifier.height(12.dp))
                o.items.forEach { item ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ProductArt(image = null, name = item.productName, size = 48.dp)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.productName, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                            Text(specText(item.cup, item.temperature, item.sugar), fontSize = 12.sp, color = Color(0xFF8A968D))
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(formatYuan(item.price), fontSize = 14.sp, color = Brand900)
                            Text("×${item.quantity}", fontSize = 12.sp, color = Color(0xFF8A968D))
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
        }

        if (o.status == "pending_payment") {
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(52.dp),
                shape = RoundedCornerShape(26.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Brand600),
            ) {
                Text("去支付 ${formatYuan(o.payableAmount)}", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(label, fontSize = 14.sp, color = Color(0xFF5C6B60))
        Spacer(Modifier.weight(1f))
        Text(value, fontSize = 14.sp, color = Brand900)
    }
}
