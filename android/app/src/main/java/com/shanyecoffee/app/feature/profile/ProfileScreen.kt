package com.shanyecoffee.app.feature.profile

import android.widget.Toast
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shanyecoffee.app.core.data.SessionManager
import com.shanyecoffee.app.core.ui.components.StateViews
import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.Cream
import com.shanyecoffee.app.core.ui.theme.Gold
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.TextPrimary
import com.shanyecoffee.app.core.ui.theme.TextSecondary
import com.shanyecoffee.app.core.util.MemberLevels

/**
 * 我的页（设计稿 AD6）
 * 会员卡（手机号脱敏、等级徽章、积分与升级进度）、优惠券 / 订单 / 积分统计、菜单入口。
 */
@Composable
fun ProfileScreen(
    onNeedLogin: () -> Unit = {},
    onGoToOrders: () -> Unit = {},
    viewModel: ProfileViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    ProfileContent(
        state = state,
        onNeedLogin = onNeedLogin,
        onGoToOrders = onGoToOrders,
    )
}

/** 我的页内容（纯渲染，演示数据可直接传入用于截图测试） */
@Composable
fun ProfileContent(
    state: ProfileUiState,
    onNeedLogin: () -> Unit = {},
    onGoToOrders: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current

    // 未登录时跳转登录页
    LaunchedEffect(Unit) {
        if (!SessionManager.isLoggedIn) {
            onNeedLogin()
        }
    }

    if (state.loading) {
        StateViews.LoadingView()
    } else if (state.error != null) {
        StateViews.ErrorView(message = state.error ?: "加载失败")
    } else {
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(Cream)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            // 会员卡
            MemberCard(points = state.points, phone = state.phone)

            // 统计
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(Radii.card))
                    .padding(vertical = 20.dp),
            ) {
                StatItem(count = state.couponCount, label = "优惠券", modifier = Modifier.weight(1f))
                StatItem(count = state.orderCount, label = "订单", modifier = Modifier.weight(1f))
                StatItem(count = state.points, label = "积分", modifier = Modifier.weight(1f))
            }

            // 菜单
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(Radii.card)),
            ) {
                MenuRow(
                    icon = Icons.Filled.Receipt,
                    label = "我的订单",
                    onClick = onGoToOrders,
                )
                MenuRow(
                    icon = Icons.Filled.ConfirmationNumber,
                    label = "我的优惠券",
                    onClick = { Toast.makeText(context, "敬请期待", Toast.LENGTH_SHORT).show() },
                )
                MenuRow(
                    icon = Icons.Filled.Star,
                    label = "会员权益",
                    onClick = { Toast.makeText(context, "敬请期待", Toast.LENGTH_SHORT).show() },
                )
                MenuRow(
                    icon = Icons.Filled.Settings,
                    label = "设置",
                    onClick = { Toast.makeText(context, "敬请期待", Toast.LENGTH_SHORT).show() },
                    showDivider = false,
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun MemberCard(
    points: Int,
    phone: String,
) {
    val level = MemberLevels.of(points)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(BrandGreen, RoundedCornerShape(Radii.card))
            .padding(20.dp)
            .testTag("member_card"),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .background(Gold, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "山",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandGreen,
                )
            }
            Spacer(modifier = Modifier.size(16.dp))
            Column {
                Text(
                    text = phone,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White,
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = level.name,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = BrandGreen,
                    modifier = Modifier
                        .background(Gold, RoundedCornerShape(Radii.thumb))
                        .padding(horizontal = 10.dp, vertical = 3.dp),
                )
            }
        }
        Spacer(modifier = Modifier.height(18.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "积分 ${"%,d".format(java.util.Locale.CHINA, points)}",
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White,
                modifier = Modifier.weight(1f),
            )
            Text(
                text = MemberLevels.nextLevelHint(points),
                fontSize = 13.sp,
                color = Color(0xFFF5D9B8),
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .background(Color.White.copy(alpha = 0.25f), RoundedCornerShape(Radii.pill)),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(MemberLevels.progress(points))
                    .height(8.dp)
                    .background(Gold, RoundedCornerShape(Radii.pill)),
            )
        }
    }
}

@Composable
private fun StatItem(
    count: Int,
    label: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "%,d".format(java.util.Locale.CHINA, count),
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = TextPrimary,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = label, fontSize = 13.sp, color = TextSecondary)
    }
}

@Composable
private fun MenuRow(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    showDivider: Boolean = true,
) {
    Column {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onClick)
                .padding(horizontal = 16.dp, vertical = 16.dp)
                .testTag("menu_$label"),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = BrandGreen,
                modifier = Modifier.size(22.dp),
            )
            Text(
                text = label,
                fontSize = 15.sp,
                color = TextPrimary,
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 12.dp),
            )
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = TextSecondary,
            )
        }
        if (showDivider) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 50.dp)
                    .height(1.dp)
                    .background(Color(0xFFF3EDE2)),
            )
        }
    }
}
