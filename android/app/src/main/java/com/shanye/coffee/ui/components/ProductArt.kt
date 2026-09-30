package com.shanye.coffee.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Coffee
import androidx.compose.material.icons.filled.LocalCafe
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.shanye.coffee.ui.theme.Brand100
import com.shanye.coffee.ui.theme.Cream100

/** 商品插画：自绘图标（不依赖外部图片）。按商品类型显示不同图标与底色。 */
@Composable
fun ProductArt(
    image: String?,
    name: String,
    modifier: Modifier = Modifier,
    size: Dp = 64.dp,
) {
    val (icon, bg) = when {
        image == null || image.contains("coffee") || image.contains("latte") ||
            image.contains("americano") || image.contains("mocha") || image.contains("cappuccino") ->
            Icons.Filled.Coffee to Color(0xFFF5E6CC)
        image.contains("tea") || image.contains("matcha") || image.contains("jasmine") ->
            Icons.Filled.LocalCafe to Color(0xFFE0EDE2)
        image.contains("croissant") || image.contains("bagel") || image.contains("sandwich") ||
            image.contains("cake") || image.contains("tiramisu") ->
            Icons.Filled.Coffee to Color(0xFFF5EEE1)
        else -> Icons.Filled.ShoppingBag to Brand100
    }
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = name,
            tint = Color(0xFF6B4226),
            modifier = Modifier.size(size),
        )
    }
}
