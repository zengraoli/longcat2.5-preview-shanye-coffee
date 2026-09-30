package com.shanye.coffee.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shanye.coffee.data.Coupon
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.couponDiscount
import com.shanye.coffee.data.formatYuan
import com.shanye.coffee.data.specText
import com.shanye.coffee.ui.components.ProductArt
import com.shanye.coffee.ui.theme.Brand100
import com.shanye.coffee.ui.theme.Brand600
import com.shanye.coffee.ui.theme.Brand900
import com.shanye.coffee.ui.theme.Caramel600
import com.shanye.coffee.ui.theme.Cream50
import kotlinx.coroutines.launch

@Composable
fun CheckoutScreen(
    repository: Repository,
    onPaid: (Int) -> Unit,
) {
    var stores by remember { mutableStateOf<List<com.shanye.coffee.data.Store>>(emptyList()) }
    var coupons by remember { mutableStateOf<List<Coupon>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var type by remember { mutableStateOf("pickup") }
    var selectedCouponId by remember { mutableStateOf<Int?>(null) }
    var submitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    // 从点单页传入的购物车（通过 savedStateHandle 或共享状态，这里简化用 repository 重新获取）
    // 实际应由导航参数传入，这里用 OrderScreen 的购物车状态
    var cartItems by remember { mutableStateOf<List<CartItem>>(emptyList()) }

    LaunchedEffect(Unit) {
        try {
            stores = repository.stores()
            coupons = repository.myCoupons()
        } finally {
            loading = false
        }
    }

    val originalAmount = cartItems.sumOf { it.price * it.quantity }
    val promoDiscount = cartItems.sumOf { item ->
        // 第二杯半价：同商品同规格每两件第二件半价
        val halfCount = item.quantity / 2
        halfCount * (item.price / 2)
    }
    val afterPromo = originalAmount - promoDiscount
    val bestCoupon = coupons.filter { it.usable }.maxByOrNull { couponDiscount(it, afterPromo) }
    val effectiveCouponId = selectedCouponId ?: bestCoupon?.id
    val coupon = coupons.find { it.id == effectiveCouponId }
    val discount = if (coupon != null) couponDiscount(coupon, afterPromo) else 0
    val payable = afterPromo - discount

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream50),
    ) {
        // 标题
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("确认订单", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Brand900)
        }

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // 门店 + 自提/堂食
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(stores.firstOrNull()?.name ?: "门店", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                            Spacer(Modifier.weight(1f))
                            Row(
                                modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(Brand100).padding(3.dp),
                            ) {
                                Text("自提", fontSize = 12.sp, color = if (type == "pickup") Brand600 else Color(0xFF8A968D),
                                    modifier = Modifier.clip(RoundedCornerShape(13.dp)).background(if (type == "pickup") Cream50 else Color.Transparent).clickable { type = "pickup" }.padding(horizontal = 14.dp, vertical = 5.dp))
                                Text("堂食", fontSize = 12.sp, color = if (type == "dine_in") Brand600 else Color(0xFF8A968D),
                                    modifier = Modifier.clip(RoundedCornerShape(13.dp)).background(if (type == "dine_in") Cream50 else Color.Transparent).clickable { type = "dine_in" }.padding(horizontal = 14.dp, vertical = 5.dp))
                            }
                        }
                        Text("营业中 07:30-21:00", fontSize = 12.sp, color = Color(0xFF8A968D))
                    }
                }
            }

            // 商品明细
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("商品", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                        Spacer(Modifier.height(12.dp))
                        cartItems.forEach { item ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                ProductArt(image = item.image, name = item.name, size = 48.dp)
                                Spacer(Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
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
            }

            // 优惠券
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.clickable { },
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("优惠券", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                        Spacer(Modifier.weight(1f))
                        Text(
                            if (coupon != null) "${coupon.name}（已选最优）" else "无可用优惠券",
                            fontSize = 13.sp,
                            color = if (coupon != null) Caramel600 else Color(0xFF8A968D),
                        )
                        Icon(Icons.Filled.KeyboardArrowRight, contentDescription = null, tint = Color(0xFF8A968D))
                    }
                }
            }

            // 金额明细
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        AmountRow("商品原价", formatYuan(originalAmount))
                        if (promoDiscount > 0) AmountRow("第二杯半价", "-${formatYuan(promoDiscount)}", Caramel600)
                        if (discount > 0) AmountRow("优惠券", "-${formatYuan(discount)}", Caramel600)
                        Spacer(Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            Text("实付", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Brand900)
                            Spacer(Modifier.weight(1f))
                            Text(formatYuan(payable), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Brand900)
                        }
                    }
                }
            }
        }

        // 底部支付栏
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(formatYuan(payable), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Brand900)
                if (promoDiscount + discount > 0) {
                    Text("已优惠 ${formatYuan(promoDiscount + discount)}", fontSize = 12.sp, color = Caramel600)
                }
            }
            Button(
                onClick = {
                    submitting = true
                    error = ""
                    scope.launch {
                        try {
                            val order = repository.createOrder(
                                com.shanye.coffee.data.CreateOrderRequest(
                                    storeId = stores.firstOrNull()?.id ?: 1,
                                    type = type,
                                    items = cartItems.map {
                                        com.shanye.coffee.data.OrderItemRequest(
                                            productId = it.productId,
                                            cup = it.cup,
                                            temperature = it.temperature,
                                            sugar = it.sugar,
                                            quantity = it.quantity,
                                        )
                                    },
                                    couponId = effectiveCouponId,
                                ),
                            )
                            val paid = repository.pay(order.id)
                            submitting = false
                            onPaid(paid.id)
                        } catch (e: Exception) {
                            submitting = false
                            error = e.message ?: "下单失败"
                        }
                    }
                },
                enabled = !submitting && cartItems.isNotEmpty(),
                shape = RoundedCornerShape(26.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Brand600),
                modifier = Modifier.height(52.dp),
            ) {
                if (submitting) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Cream50, strokeWidth = 2.dp)
                } else {
                    Text("模拟支付", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 24.dp))
                }
            }
        }
    }
}

@Composable
private fun AmountRow(label: String, value: String, valueColor: Color = Brand900) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text(label, fontSize = 14.sp, color = Color(0xFF5C6B60))
        Spacer(Modifier.weight(1f))
        Text(value, fontSize = 14.sp, color = valueColor)
    }
}
