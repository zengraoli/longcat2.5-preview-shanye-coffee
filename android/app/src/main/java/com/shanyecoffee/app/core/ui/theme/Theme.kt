package com.shanyecoffee.app.core.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val ShanYeColorScheme = lightColorScheme(
    primary = BrandGreen,
    onPrimary = CardWhite,
    primaryContainer = BrandGreen,
    onPrimaryContainer = CardWhite,
    secondary = Terracotta,
    onSecondary = CardWhite,
    secondaryContainer = TagOrangeBg,
    onSecondaryContainer = Terracotta,
    background = Cream,
    onBackground = TextPrimary,
    surface = CardWhite,
    onSurface = TextPrimary,
    surfaceVariant = Cream,
    onSurfaceVariant = TextSecondary,
    outline = DividerColor,
    outlineVariant = DividerColor,
    error = Terracotta,
    onError = CardWhite,
)

// 圆角（对齐设计稿）
object Radii {
    val card = 16.dp
    val sheet = 20.dp
    val pill = 999.dp
    val thumb = 12.dp
}

@Composable
fun ShanYeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    // 品牌为固定浅色主题，不跟随系统暗色
    MaterialTheme(
        colorScheme = ShanYeColorScheme,
        typography = ShanYeTypography,
        content = content,
    )
}
