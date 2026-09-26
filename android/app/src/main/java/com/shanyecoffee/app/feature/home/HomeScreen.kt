package com.shanyecoffee.app.feature.home

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shanyecoffee.app.core.api.ProductDto
import com.shanyecoffee.app.core.cart.CartManager
import com.shanyecoffee.app.core.ui.components.CupArt
import com.shanyecoffee.app.core.ui.components.categoryCupColors
import com.shanyecoffee.app.core.ui.components.StateViews
import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.Cream
import com.shanyecoffee.app.core.ui.theme.PriceLarge
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.Terracotta
import com.shanyecoffee.app.core.ui.theme.TextPrimary
import com.shanyecoffee.app.core.ui.theme.TextSecondary
import com.shanyecoffee.app.core.util.PriceFormat
import com.shanyecoffee.app.core.util.TimeFormat

/**
 * 首页（设计稿 AD2）
 * 门店选择与营业状态、活动横幅、自提 / 堂食入口、当季推荐（活动商品）。
 */
@Composable
fun HomeScreen(
    onGoToOrder: (orderType: String) -> Unit = {},
    onNeedLogin: () -> Unit = {},
    viewModel: HomeViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    HomeContent(
        state = state,
        onGoToOrder = onGoToOrder,
        onStoreSelected = viewModel::selectStore,
        onRetry = viewModel::load,
        onQuickAdd = viewModel::quickAdd,
    )
}

/** 首页内容（纯渲染，演示数据可直接传入用于截图测试） */
@Composable
fun HomeContent(
    state: HomeUiState,
    onGoToOrder: (orderType: String) -> Unit,
    onStoreSelected: (Int) -> Unit = {},
    onRetry: () -> Unit = {},
    onQuickAdd: (ProductDto) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var showStorePicker by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream)
            .verticalScroll(rememberScrollState()),
    ) {
        // 门店选择
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .clickable { showStorePicker = true }
                .testTag("store_selector"),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Filled.LocationOn,
                contentDescription = null,
                tint = BrandGreen,
            )
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = state.selectedStore?.name ?: "选择门店",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandGreen,
                    )
                    Icon(
                        imageVector = Icons.Filled.KeyboardArrowDown,
                        contentDescription = null,
                        tint = BrandGreen,
                    )
                }
                Text(
                    text = state.selectedStore?.let { store ->
                        val statusText = if (store.status == "open") "营业中" else "休息中"
                        "$statusText · ${store.openTime}-${store.closeTime}"
                    } ?: "选择门店",
                    fontSize = 13.sp,
                    color = TextSecondary,
                )
            }
            Icon(
                imageVector = Icons.Filled.Search,
                contentDescription = "搜索",
                tint = TextSecondary,
            )
        }

        DropdownMenu(expanded = showStorePicker, onDismissRequest = { showStorePicker = false }) {
            state.stores.forEach { store ->
                DropdownMenuItem(
                    text = {
                        Text(
                            text = store.name,
                            color = if (store.id == state.selectedStoreId) BrandGreen else TextPrimary,
                        )
                    },
                    onClick = {
                        onStoreSelected(store.id)
                        showStorePicker = false
                    },
                )
            }
        }

        if (state.loading) {
            StateViews.LoadingView()
        } else if (state.error != null) {
            StateViews.ErrorView(
                message = state.error ?: "加载失败",
                onRetry = onRetry,
            )
        } else {
            // 活动横幅（数据来自 server 进行中的活动）
            state.promotion?.let { promotion ->
                val range = TimeFormat.isoRangeToBeijing(promotion.startTime, promotion.endTime)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .heightIn(min = 118.dp)
                        .background(Terracotta, RoundedCornerShape(Radii.card))
                        .padding(16.dp)
                        .testTag("promo_banner"),
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(text = "限时活动", fontSize = 13.sp, color = Color(0xFFF5D9B8))
                        Text(
                            text = promotion.name,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                        Text(text = range, fontSize = 13.sp, color = Color(0xFFF5D9B8))
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Box(
                        modifier = Modifier
                            .size(88.dp)
                            .background(Color(0xFFF5E3C2), RoundedCornerShape(Radii.thumb)),
                        contentAlignment = Alignment.Center,
                    ) {
                        CupArt(modifier = Modifier.size(64.dp))
                    }
                }
            }

            // 自提 / 堂食入口
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                EntryCard(
                    title = "自提",
                    desc = "到店取餐，免排队",
                    modifier = Modifier.weight(1f),
                    onClick = { onGoToOrder(CartManager.TYPE_PICKUP) },
                )
                EntryCard(
                    title = "堂食",
                    desc = "店内享用",
                    modifier = Modifier.weight(1f),
                    onClick = { onGoToOrder(CartManager.TYPE_DINE_IN) },
                )
            }

            // 当季推荐
            val recommended = state.recommended
            if (recommended.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "当季推荐",
                        style = androidx.compose.material3.MaterialTheme.typography.titleLarge,
                        color = TextPrimary,
                    )
                    Text(
                        text = "全部菜单",
                        fontSize = 14.sp,
                        color = TextSecondary,
                        modifier = Modifier
                            .clickable { onGoToOrder(CartManager.orderType.value) }
                            .testTag("btn_all_menu"),
                    )
                }

                Column(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    recommended.chunked(2).forEach { rowItems ->
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            rowItems.forEach { product ->
                                RecommendCard(
                                    product = product,
                                    loading = state.quickAddingProductId == product.id,
                                    onAdd = { onQuickAdd(product) },
                                    onClick = { onGoToOrder(CartManager.orderType.value) },
                                    modifier = Modifier.weight(1f),
                                )
                            }
                            if (rowItems.size == 1) Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun EntryCard(
    title: String,
    desc: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Column(
        modifier = modifier
            .background(Color.White, RoundedCornerShape(Radii.card))
            .clickable(onClick = onClick)
            .padding(16.dp)
            .testTag("entry_$title"),
    ) {
        Text(
            text = title,
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
            color = TextPrimary,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(text = desc, fontSize = 13.sp, color = TextSecondary)
    }
}

@Composable
private fun RecommendCard(
    product: ProductDto,
    loading: Boolean,
    onAdd: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val (cupBg, liquid) = categoryCupColors(product.categoryId)
    Column(
        modifier = modifier
            .background(Color.White, RoundedCornerShape(Radii.card))
            .clickable(onClick = onClick)
            .padding(bottom = 12.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(96.dp)
                .background(cupBg, RoundedCornerShape(topStart = Radii.card, topEnd = Radii.card)),
            contentAlignment = Alignment.Center,
        ) {
            CupArt(modifier = Modifier.padding(12.dp), cupBg = Color.Transparent, liquid = liquid)
        }
        Text(
            text = product.name,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = TextPrimary,
            maxLines = 1,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = PriceFormat.fenToYuan(product.price),
                style = PriceLarge,
                color = TextPrimary,
                modifier = Modifier.testTag("price_${product.id}"),
            )
            IconButton(
                onClick = onAdd,
                modifier = Modifier
                    .size(36.dp)
                    .background(BrandGreen, CircleShape)
                    .testTag("btn_quick_add_${product.id}"),
            ) {
                if (loading) {
                    androidx.compose.material3.CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = Color.White,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Icon(
                        imageVector = Icons.Filled.Add,
                        contentDescription = "加入购物车",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp),
                    )
                }
            }
        }
    }
}
