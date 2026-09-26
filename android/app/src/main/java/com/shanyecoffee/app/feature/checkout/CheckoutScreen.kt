package com.shanyecoffee.app.feature.checkout

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp

@Composable
fun CheckoutScreen(
    onNeedLogin: () -> Unit = {},
    onPaySuccess: (orderId: Int) -> Unit = {},
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = "确认订单（待实现）", fontSize = 16.sp)
    }
}
