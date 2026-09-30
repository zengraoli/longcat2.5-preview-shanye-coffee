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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import com.shanye.coffee.data.Product
import com.shanye.coffee.data.AuthState
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.Store
import com.shanye.coffee.data.formatYuan
import com.shanye.coffee.ui.components.ProductArt
import com.shanye.coffee.ui.theme.Brand100
import com.shanye.coffee.ui.theme.Brand600
import com.shanye.coffee.ui.theme.Brand900
import com.shanye.coffee.ui.theme.Caramel500
import com.shanye.coffee.ui.theme.Caramel600
import com.shanye.coffee.ui.theme.Cream100
import com.shanye.coffee.ui.theme.Cream50

@Composable
fun HomeScreen(
    repository: Repository,
    onGoToOrder: () -> Unit,
    onGoToMenu: () -> Unit,
) {
    var stores by remember { mutableStateOf<List<Store>>(emptyList()) }
    var products by remember { mutableStateOf<List<Product>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var selectedStoreId by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        try {
            val storeList = repository.stores()
            stores = storeList
            selectedStoreId = storeList.firstOrNull { it.isOpen }?.id ?: storeList.firstOrNull()?.id ?: 0
            products = repository.products()
        } catch (e: com.shanye.coffee.data.UnauthorizedException) {
            AuthState.onUnauthorized()
        } catch (e: Exception) {
            // 忽略其他错误
        } finally {
            loading = false
        }
    }

    val selectedStore = stores.find { it.id == selectedStoreId }
    val recommended = products.filter { !it.soldOut }.take(4)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream50),
    ) {
        // 顶部：门店选择
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Filled.LocationOn, contentDescription = null, tint = Brand600)
            Spacer(Modifier.width(4.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        selectedStore?.name ?: "选择门店",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Brand900,
                    )
                    Icon(Icons.Filled.KeyboardArrowDown, contentDescription = null, tint = Brand900)
                }
                Text(
                    if (selectedStore?.isOpen == true) "营业中" else "休息中",
                    fontSize = 12.sp,
                    color = if (selectedStore?.isOpen == true) Brand600 else Color(0xFFB0483E),
                )
            }
            Icon(Icons.Filled.Search, contentDescription = null, tint = Brand900)
        }

        // 活动横幅
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(120.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Caramel500)
                .padding(16.dp),
        ) {
            Column {
                Text("秋日限定", fontSize = 12.sp, color = Cream50)
                Text("桂花拿铁 第二杯半价", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Cream50)
                Text("9月19日 - 9月30日", fontSize = 12.sp, color = Cream50)
            }
        }

        Spacer(Modifier.height(16.dp))

        // 自提 / 堂食入口
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            EntryCard(title = "自提", desc = "到店取餐，免排队", modifier = Modifier.weight(1f), onClick = onGoToOrder)
            EntryCard(title = "堂食", desc = "店内享用", modifier = Modifier.weight(1f), onClick = onGoToOrder)
        }

        Spacer(Modifier.height(20.dp))

        // 当季推荐
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("当季推荐", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Brand900, modifier = Modifier.weight(1f))
            Text("全部菜单", fontSize = 13.sp, color = Color(0xFF8A968D), modifier = Modifier.clickable { onGoToMenu() })
        }

        Spacer(Modifier.height(12.dp))

        if (loading) {
            Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Brand600)
            }
        } else {
            LazyRow(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(recommended) { p ->
                    RecommendCard(product = p, onClick = onGoToOrder)
                }
            }
        }
    }
}

@Composable
private fun EntryCard(title: String, desc: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        modifier = modifier
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Brand900)
            Spacer(Modifier.height(4.dp))
            Text(desc, fontSize = 12.sp, color = Color(0xFF8A968D))
        }
    }
}

@Composable
private fun RecommendCard(product: Product, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(150.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .background(Cream100),
                contentAlignment = Alignment.Center,
            ) {
                ProductArt(image = product.image, name = product.name, size = 80.dp)
            }
            Column(modifier = Modifier.padding(12.dp)) {
                Text(product.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(formatYuan(product.price), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Caramel600)
                    Spacer(Modifier.weight(1f))
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(Brand600),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null, tint = Cream50, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}
