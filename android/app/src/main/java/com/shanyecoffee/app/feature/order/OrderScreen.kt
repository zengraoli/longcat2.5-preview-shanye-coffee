package com.shanyecoffee.app.feature.order

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shanyecoffee.app.core.api.ProductDto
import com.shanyecoffee.app.core.api.ProductSpecDto
import com.shanyecoffee.app.core.cart.CartManager
import com.shanyecoffee.app.core.ui.components.CupArt
import com.shanyecoffee.app.core.ui.components.StateViews
import com.shanyecoffee.app.core.ui.components.categoryCupColors
import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.Cream
import com.shanyecoffee.app.core.ui.theme.PriceLarge
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.SoldOutBg
import com.shanyecoffee.app.core.ui.theme.SoldOutText
import com.shanyecoffee.app.core.ui.theme.TagOrangeBg
import com.shanyecoffee.app.core.ui.theme.Terracotta
import com.shanyecoffee.app.core.ui.theme.TextPrimary
import com.shanyecoffee.app.core.ui.theme.TextSecondary
import com.shanyecoffee.app.core.util.PriceFormat

/**
 * 点单页（设计稿 AD3）
 * 分类 Tab、商品列表、规格底部弹窗、售罄状态、购物车条（体现第二杯半价优惠）。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderScreen(
    onNeedLogin: () -> Unit = {},
    onGoToCheckout: () -> Unit = {},
    viewModel: OrderViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val cartLines by CartManager.lines.collectAsState()
    val orderType by CartManager.orderType.collectAsState()

    OrderContent(
        state = state,
        cartLines = cartLines,
        orderType = orderType,
        onGoToCheckout = onGoToCheckout,
        onOrderTypeChange = viewModel::setOrderType,
        onCategorySelected = viewModel::selectCategory,
        onRetry = viewModel::load,
        onSpec = viewModel::openSpec,
        onSpecDismiss = viewModel::closeSpec,
        onSpecChange = viewModel::updateSpec,
        onQuantityChange = viewModel::setQuantity,
        onAddToCart = viewModel::addToCart,
    )
}

/** 点单页内容（纯渲染，演示数据可直接传入用于截图测试） */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderContent(
    state: OrderUiState,
    cartLines: List<CartManager.Line>,
    orderType: String,
    onGoToCheckout: () -> Unit,
    onOrderTypeChange: (String) -> Unit = {},
    onCategorySelected: (Int) -> Unit = {},
    onRetry: () -> Unit = {},
    onSpec: (com.shanyecoffee.app.core.api.ProductDto) -> Unit = {},
    onSpecDismiss: () -> Unit = {},
    onSpecChange: (cupSize: String?, temperature: String?, sugar: String?) -> Unit = { _, _, _ -> },
    onQuantityChange: (Int) -> Unit = {},
    onAddToCart: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize().background(Cream)) {
        Column(modifier = Modifier.fillMaxSize()) {
            // 顶部：标题 + 取餐方式
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "点单",
                    style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f),
                )
                TypeToggle(
                    selected = orderType,
                    onSelect = onOrderTypeChange,
                )
            }

            // 分类 Tab
            if (state.categories.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(24.dp),
                ) {
                    state.categories.forEach { category ->
                        val selected = category.id == state.selectedCategoryId
                        Column(
                            modifier = Modifier
                                .clickable { onCategorySelected(category.id) }
                                .padding(vertical = 6.dp)
                                .testTag("tab_category_${category.id}"),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(
                                text = category.name,
                                fontSize = 16.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                color = if (selected) BrandGreen else TextSecondary,
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .width(28.dp)
                                    .height(2.dp)
                                    .background(if (selected) Terracotta else Color.Transparent),
                            )
                        }
                    }
                }
                HorizontalDivider(color = androidx.compose.ui.graphics.Color(0xFFEDE6D8))
            }

            if (state.loading) {
                StateViews.LoadingView()
            } else if (state.error != null) {
                StateViews.ErrorView(message = state.error ?: "加载失败", onRetry = onRetry)
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .testTag("product_list"),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        start = 16.dp,
                        end = 16.dp,
                        top = 12.dp,
                        bottom = 120.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(state.visibleProducts, key = { it.id }) { product ->
                        ProductCard(
                            product = product,
                            promo = state.isPromo(product.id),
                            onSpec = { onSpec(product) },
                        )
                    }
                }
            }
        }

        // 购物车条（固定在底部导航之上，悬浮样式）
        val promoDiscount = CartManager.promoDiscount(state.promoProductIds)
        val payTotal = cartLines.sumOf { it.unitPrice * it.quantity } - promoDiscount
        if (cartLines.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .background(BrandGreen, RoundedCornerShape(24.dp))
                    .padding(horizontal = 20.dp, vertical = 14.dp)
                    .testTag("cart_bar"),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = PriceFormat.fenToYuan(payTotal),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                    )
                    if (promoDiscount > 0) {
                        Text(
                            text = "已享第二杯半价 -${PriceFormat.fenToYuan(promoDiscount)}",
                            fontSize = 12.sp,
                            color = Color(0xFFF5C98A),
                        )
                    }
                }
                Button(
                    onClick = onGoToCheckout,
                    modifier = Modifier
                        .heightIn(min = 44.dp)
                        .testTag("btn_checkout"),
                    shape = RoundedCornerShape(Radii.pill),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Terracotta,
                        contentColor = Color.White,
                    ),
                ) {
                    Text(text = "去结算", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }

    // 规格底部弹窗
    val spec = state.spec
    if (spec != null) {
        SpecBottomSheet(
            spec = spec,
            loading = state.specLoading,
            onDismiss = onSpecDismiss,
            onSpecChange = onSpecChange,
            onQuantityChange = onQuantityChange,
            onAddToCart = onAddToCart,
        )
    }
}

@Composable
private fun TypeToggle(
    selected: String,
    onSelect: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .background(Cream, RoundedCornerShape(Radii.pill))
            .padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        TypeOption(
            label = "自提",
            selected = selected == CartManager.TYPE_PICKUP,
            onClick = { onSelect(CartManager.TYPE_PICKUP) },
        )
        TypeOption(
            label = "堂食",
            selected = selected == CartManager.TYPE_DINE_IN,
            onClick = { onSelect(CartManager.TYPE_DINE_IN) },
        )
    }
}

@Composable
private fun TypeOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .background(
                if (selected) BrandGreen else Color.Transparent,
                RoundedCornerShape(Radii.pill),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = if (selected) Color.White else TextSecondary,
        )
    }
}

@Composable
private fun ProductCard(
    product: ProductDto,
    promo: Boolean,
    onSpec: () -> Unit,
) {
    val (cupBg, liquid) = categoryCupColors(product.categoryId)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(Radii.thumb))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(84.dp)
                .background(cupBg, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center,
        ) {
            CupArt(
                modifier = Modifier.size(72.dp),
                cupBg = Color.Transparent,
                liquid = liquid,
            )
        }
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = product.name,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                if (promo) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "第二杯半价",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = Terracotta,
                        maxLines = 1,
                        modifier = Modifier
                            .background(TagOrangeBg, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                    )
                }
            }
            Text(
                text = product.description,
                fontSize = 13.sp,
                color = TextSecondary,
                maxLines = 1,
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = PriceFormat.fenToYuan(product.price),
                style = PriceLarge,
                color = TextPrimary,
                modifier = Modifier.testTag("price_${product.id}"),
            )
        }
        if (product.soldOut) {
            Text(
                text = "已售罄",
                fontSize = 13.sp,
                color = SoldOutText,
                modifier = Modifier
                    .background(SoldOutBg, RoundedCornerShape(Radii.pill))
                    .padding(horizontal = 14.dp, vertical = 8.dp),
            )
        } else {
            Button(
                onClick = onSpec,
                modifier = Modifier.testTag("btn_spec_${product.id}"),
                shape = RoundedCornerShape(Radii.pill),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandGreen,
                    contentColor = Color.White,
                ),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 18.dp),
            ) {
                Text(text = "选规格", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SpecBottomSheet(
    spec: SpecSelection,
    loading: Boolean,
    onDismiss: () -> Unit,
    onSpecChange: (cupSize: String?, temperature: String?, sugar: String?) -> Unit,
    onQuantityChange: (Int) -> Unit,
    onAddToCart: () -> Unit,
) {
    val product = spec.product ?: return
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color.White,
        shape = RoundedCornerShape(topStart = Radii.sheet, topEnd = Radii.sheet),
    ) {
        if (loading) {
            StateViews.LoadingView(modifier = Modifier.height(200.dp))
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 28.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = product.name,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        modifier = Modifier.weight(1f),
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Filled.Close,
                            contentDescription = "关闭",
                            tint = TextSecondary,
                        )
                    }
                }

                val specs = product.specs
                SpecGroup(
                    label = "杯型",
                    options = specs.map { it.cupSize }.distinct().orderCupSizes(),
                    selected = spec.cupSize,
                    labelOf = ::cupLabel,
                    onSelect = { onSpecChange(it, null, null) },
                )
                SpecGroup(
                    label = "温度",
                    options = specs.map { it.temperature }.distinct().orderTemperatures(),
                    selected = spec.temperature,
                    labelOf = ::temperatureLabel,
                    onSelect = { onSpecChange(null, it, null) },
                )
                SpecGroup(
                    label = "糖度",
                    options = specs.map { it.sugar }.distinct().orderSugars(),
                    selected = spec.sugar,
                    labelOf = ::sugarLabel,
                    onSelect = { onSpecChange(null, null, it) },
                )

                // 数量
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "数量",
                        fontSize = 15.sp,
                        color = TextPrimary,
                        modifier = Modifier.weight(1f),
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        QtyButton(
                            icon = Icons.Filled.Remove,
                            enabled = spec.quantity > 1,
                            onClick = { onQuantityChange(spec.quantity - 1) },
                        )
                        Text(
                            text = "${spec.quantity}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary,
                            modifier = Modifier.width(40.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        )
                        QtyButton(
                            icon = Icons.Filled.Add,
                            enabled = spec.quantity < 99,
                            onClick = { onQuantityChange(spec.quantity + 1) },
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = PriceFormat.fenToYuan(spec.unitPrice * spec.quantity),
                        style = PriceLarge,
                        color = Terracotta,
                        modifier = Modifier.weight(1f),
                    )
                    Button(
                        onClick = onAddToCart,
                        modifier = Modifier
                            .heightIn(min = 48.dp)
                            .testTag("btn_add_to_cart"),
                        shape = RoundedCornerShape(Radii.pill),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = BrandGreen,
                            contentColor = Color.White,
                        ),
                    ) {
                        Text(text = "加入购物车", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun SpecGroup(
    label: String,
    options: List<String>,
    selected: String,
    labelOf: (String) -> String,
    onSelect: (String) -> Unit,
) {
    Column(modifier = Modifier.padding(vertical = 10.dp)) {
        Text(text = label, fontSize = 14.sp, color = TextSecondary)
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            options.forEach { option ->
                val isSelected = option == selected
                Text(
                    text = labelOf(option),
                    fontSize = 14.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (isSelected) Color.White else TextPrimary,
                    modifier = Modifier
                        .background(
                            if (isSelected) BrandGreen else Cream,
                            RoundedCornerShape(Radii.pill),
                        )
                        .clickable { onSelect(option) }
                        .padding(horizontal = 18.dp, vertical = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun QtyButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    IconButton(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier
            .size(32.dp)
            .background(Cream, CircleShape),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (enabled) BrandGreen else SoldOutText,
            modifier = Modifier.size(18.dp),
        )
    }
}

private fun List<String>.orderCupSizes(): List<String> = sortedBy { if (it == "medium") 0 else 1 }
private fun List<String>.orderTemperatures(): List<String> = sortedBy { if (it == "hot") 0 else 1 }
private fun List<String>.orderSugars(): List<String> = sortedBy { if (it == "standard") 0 else if (it == "less") 1 else 2 }

private fun cupLabel(value: String): String = if (value == "medium") "中杯" else if (value == "large") "大杯" else value
private fun temperatureLabel(value: String): String = if (value == "hot") "热" else if (value == "iced") "冰" else value
private fun sugarLabel(value: String): String = if (value == "standard") "标准" else if (value == "less") "少糖" else if (value == "none") "无糖" else value
