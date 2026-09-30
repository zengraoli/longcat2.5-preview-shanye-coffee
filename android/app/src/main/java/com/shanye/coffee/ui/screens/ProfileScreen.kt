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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Toll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
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
import com.shanye.coffee.data.Member
import com.shanye.coffee.data.AuthState
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.SessionStore
import com.shanye.coffee.data.formatYuan
import com.shanye.coffee.data.levelProgress
import com.shanye.coffee.data.maskPhone
import com.shanye.coffee.ui.theme.Brand100
import com.shanye.coffee.ui.theme.Brand600
import com.shanye.coffee.ui.theme.Brand900
import com.shanye.coffee.ui.theme.Caramel500
import com.shanye.coffee.ui.theme.Cream50
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    repository: Repository,
    sessionStore: SessionStore,
    onGoToOrders: () -> Unit,
    onGoToOrder: () -> Unit,
    onLoggedOut: () -> Unit,
) {
    var member by remember { mutableStateOf<Member?>(null) }
    var coupons by remember { mutableStateOf<List<Coupon>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            member = repository.me()
            coupons = repository.myCoupons()
        } catch (e: com.shanye.coffee.data.UnauthorizedException) {
            AuthState.onUnauthorized()
        } catch (e: Exception) {
            // 忽略其他错误
        } finally {
            loading = false
        }
    }

    val m = member
    val usableCoupons = coupons.count { it.usable }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream50),
    ) {
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Brand600)
            }
            return@Column
        }

        // 会员卡
        Card(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Brand600),
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(56.dp).clip(CircleShape).background(Caramel500),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("山", color = Cream50, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text(maskPhone(m?.phone), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Cream50)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            m?.level?.name ?: "银卡",
                            fontSize = 13.sp,
                            color = Cream50,
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0x33FFFFFF))
                                .padding(horizontal = 10.dp, vertical = 3.dp),
                        )
                    }
                }
                Spacer(Modifier.height(20.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("积分 ${m?.points ?: 0}", fontSize = 15.sp, color = Cream50, modifier = Modifier.weight(1f))
                    val next = m?.level?.pointsToNext
                    Text(
                        if (next != null) "再积 $next 分升级${m?.level?.nextLevel?.let { if (it == "black") "黑卡" else "金卡" }}" else "已达最高等级",
                        fontSize = 12.sp,
                        color = Cream50,
                    )
                }
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { levelProgress(m?.points ?: 0, m?.level?.level ?: "silver") / 100f },
                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                    color = Caramel500,
                    trackColor = Color(0x33FFFFFF),
                )
            }
        }

        // 统计卡片
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            StatCard(value = "${usableCoupons}", label = "优惠券", modifier = Modifier.weight(1f))
            StatCard(value = "12", label = "订单", modifier = Modifier.weight(1f))
            StatCard(value = "${m?.points ?: 0}", label = "积分", modifier = Modifier.weight(1f))
        }

        Spacer(Modifier.height(16.dp))

        // 菜单入口
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
        ) {
            Column {
                MenuRow(icon = Icons.Filled.List, title = "我的订单", onClick = onGoToOrders)
                MenuRow(icon = Icons.Filled.Toll, title = "我的优惠券", onClick = {})
                MenuRow(icon = Icons.Filled.Star, title = "会员权益", onClick = {})
            }
        }

        Spacer(Modifier.height(24.dp))

        // 退出登录
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        scope.launch {
                            repository.logout()
                        AuthState.setLoggedIn(false)
                            onLoggedOut()
                        }
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("退出登录", fontSize = 15.sp, color = Color(0xFFB0483E))
                Spacer(Modifier.weight(1f))
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Color(0xFFB0483E))
            }
        }
    }
}

@Composable
private fun StatCard(value: String, label: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Brand900)
            Spacer(Modifier.height(4.dp))
            Text(label, fontSize = 12.sp, color = Color(0xFF8A968D))
        }
    }
}

@Composable
private fun MenuRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = Brand600, modifier = Modifier.size(22.dp))
        Spacer(Modifier.width(12.dp))
        Text(title, fontSize = 15.sp, color = Brand900)
        Spacer(Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Color(0xFF8A968D))
    }
}
