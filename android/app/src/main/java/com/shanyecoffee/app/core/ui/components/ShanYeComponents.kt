package com.shanyecoffee.app.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowLeft
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.Cream
import com.shanyecoffee.app.core.ui.theme.Gold
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.Terracotta
import com.shanyecoffee.app.core.ui.theme.TextSecondary

/** 品牌 Logo：深绿圆形 + 自绘山峰与太阳（不依赖外部图片） */
@Composable
fun BrandLogo(modifier: Modifier = Modifier, size: Int = 96) {
    Box(
        modifier = modifier
            .size(size.dp)
            .clip(CircleShape)
            .background(BrandGreen),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val w = this.size.width
            val h = this.size.height
            // 太阳
            drawCircle(
                color = Gold,
                radius = w * 0.11f,
                center = androidx.compose.ui.geometry.Offset(w * 0.68f, h * 0.26f),
            )
            // 远山
            drawPath(
                path = androidx.compose.ui.graphics.Path().apply {
                    moveTo(w * 0.16f, h * 0.72f)
                    lineTo(w * 0.42f, h * 0.38f)
                    lineTo(w * 0.58f, h * 0.56f)
                    lineTo(w * 0.70f, h * 0.44f)
                    lineTo(w * 0.86f, h * 0.72f)
                    close()
                },
                color = Color(0xFFEDE6D8),
            )
            // 近山（品牌绿浅色叠加出层次）
            drawPath(
                path = androidx.compose.ui.graphics.Path().apply {
                    moveTo(w * 0.30f, h * 0.72f)
                    lineTo(w * 0.52f, h * 0.50f)
                    lineTo(w * 0.70f, h * 0.72f)
                    close()
                },
                color = Color(0xFF8FA598),
            )
        }
    }
}

/** 自绘咖啡杯插画：不同品类用不同底色与液面颜色区分 */
@Composable
fun CupArt(
    modifier: Modifier = Modifier,
    cupBg: Color = Color(0xFFF6E7C8),
    liquid: Color = Color(0xFFC08A4A),
) {
    androidx.compose.foundation.Canvas(modifier = modifier.fillMaxSize()) {
        val w = this.size.width
        val h = this.size.height
        // 背景
        drawRoundRect(
            color = cupBg,
            size = androidx.compose.ui.geometry.Size(w, h),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.18f, w * 0.18f),
        )
        // 杯身
        drawRoundRect(
            color = Color.White,
            topLeft = androidx.compose.ui.geometry.Offset(w * 0.18f, h * 0.20f),
            size = androidx.compose.ui.geometry.Size(w * 0.56f, h * 0.60f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.08f, w * 0.08f),
        )
        // 液面
        drawRoundRect(
            color = liquid,
            topLeft = androidx.compose.ui.geometry.Offset(w * 0.24f, h * 0.38f),
            size = androidx.compose.ui.geometry.Size(w * 0.44f, h * 0.34f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.05f, w * 0.05f),
        )
        // 杯柄
        drawRoundRect(
            color = Color.White,
            topLeft = androidx.compose.ui.geometry.Offset(w * 0.74f, h * 0.30f),
            size = androidx.compose.ui.geometry.Size(w * 0.14f, h * 0.24f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.07f, w * 0.07f),
        )
        // 热气
        drawLine(
            color = Color(0xFFB0A894),
            start = androidx.compose.ui.geometry.Offset(w * 0.36f, h * 0.10f),
            end = androidx.compose.ui.geometry.Offset(w * 0.36f, h * 0.04f),
            strokeWidth = w * 0.025f,
        )
        drawLine(
            color = Color(0xFFB0A894),
            start = androidx.compose.ui.geometry.Offset(w * 0.52f, h * 0.10f),
            end = androidx.compose.ui.geometry.Offset(w * 0.52f, h * 0.04f),
            strokeWidth = w * 0.025f,
        )
    }
}

object StateViews {

    @Composable
    fun LoadingView(modifier: Modifier = Modifier) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = BrandGreen)
        }
    }

    @Composable
    fun ErrorView(
        message: String,
        modifier: Modifier = Modifier,
        onRetry: (() -> Unit)? = null,
    ) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            androidx.compose.foundation.layout.Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = message, color = TextSecondary, textAlign = TextAlign.Center)
                if (onRetry != null) {
                    androidx.compose.material3.TextButton(onClick = onRetry) {
                        Text("重试", color = Terracotta)
                    }
                }
            }
        }
    }

    @Composable
    fun EmptyView(text: String, modifier: Modifier = Modifier) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(32.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(text = text, color = TextSecondary, textAlign = TextAlign.Center)
        }
    }
}

/** 加载态 */
@Composable
fun LoadingView(modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = BrandGreen)
    }
}

/** 错误态：message 为中文原因 */
@Composable
fun ErrorView(
    message: String,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null,
) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.layout.Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = message, color = TextSecondary, textAlign = TextAlign.Center)
            if (onRetry != null) {
                androidx.compose.material3.TextButton(onClick = onRetry) {
                    Text("重试", color = Terracotta)
                }
            }
        }
    }
}

/** 空态 */
@Composable
fun EmptyView(text: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text = text, color = TextSecondary, textAlign = TextAlign.Center)
    }
}

/** 按商品分类返回插画配色（背景底色 / 液面颜色） */
fun categoryCupColors(categoryId: Int): Pair<Color, Color> = when (categoryId) {
    2 -> Color(0xFFDDE8D2) to Color(0xFFC9B18A)   // 茶饮：浅绿底 + 茶色液面
    3 -> Color(0xFFEFE3D0) to Color(0xFFD9B98A)   // 轻食：浅杏底
    4 -> Color(0xFFDDE5EC) to Color(0xFF9AA5B1)   // 周边：浅灰蓝底
    else -> Color(0xFFF6E7C8) to Color(0xFFC08A4A) // 奶油黄底 + 咖啡液面
}

/** 页面标题栏（返回 + 标题） */
@Composable
fun ScreenTitleBar(
    title: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
) {
    androidx.compose.foundation.layout.Row(
        modifier = modifier.padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            androidx.compose.material3.IconButton(onClick = onBack) {
                androidx.compose.material3.Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowLeft,
                    contentDescription = "返回",
                )
            }
        }
        Text(text = title, style = androidx.compose.material3.MaterialTheme.typography.headlineMedium)
    }
}
