package com.shanye.coffee.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val LightColorScheme = lightColorScheme(
    primary = Brand600,
    onPrimary = Cream50,
    primaryContainer = Brand100,
    onPrimaryContainer = Brand900,
    secondary = Caramel500,
    onSecondary = Cream50,
    secondaryContainer = Cream100,
    onSecondaryContainer = Caramel600,
    tertiary = Brand400,
    background = Cream50,
    onBackground = Brand900,
    surface = Cream50,
    onSurface = Brand900,
    surfaceVariant = Cream100,
    onSurfaceVariant = Brand700,
    outline = Brand200,
    error = Color(0xFFB0483E),
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

@Composable
fun ShanyeCoffeeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        shapes = AppShapes,
        content = content,
    )
}
