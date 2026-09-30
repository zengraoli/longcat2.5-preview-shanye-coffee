package com.shanye.coffee.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import com.shanye.coffee.data.Category
import com.shanye.coffee.data.Product
import com.shanye.coffee.data.ProductSpec
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.formatYuan
import com.shanye.coffee.data.specText
import com.shanye.coffee.ui.components.ProductArt
import com.shanye.coffee.ui.theme.Brand100
import com.shanye.coffee.ui.theme.Brand600
import com.shanye.coffee.ui.theme.Brand900
import com.shanye.coffee.ui.theme.Caramel500
import com.shanye.coffee.ui.theme.Caramel600
import com.shanye.coffee.ui.theme.Cream100
import com.shanye.coffee.ui.theme.Cream50
import kotlinx.coroutines.launch

data class CartItem(
    val productId: Int,
    val name: String,
    val image: String?,
    val cup: String?,
    val temperature: String?,
    val sugar: String?,
    val price: Int,
    val quantity: Int,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderScreen(
    repository: Repository,
    onGoToCheckout: () -> Unit,
) {
    var categories by remember { mutableStateOf<List<Category>>(emptyList()) }
    var products by remember { mutableStateOf<List<Product>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var selectedCategoryId by remember { mutableStateOf(0) }
    var cart by remember { mutableStateOf<List<CartItem>>(emptyList()) }
    var specProduct by remember { mutableStateOf<Product?>(null) }
    val scope = rememberCoroutineScope()
    val sheetState = rememberModalBottomSheetState()

    LaunchedEffect(Unit) {
        try {
            categories = repository.categories()
            products = repository.products()
            selectedCategoryId = categories.firstOrNull()?.id ?: 0
        } finally {
            loading = false
        }
    }

    val filteredProducts = if (selectedCategoryId == 0) products
        else products.filter { it.categoryId == selectedCategoryId }

    val cartTotal = cart.sumOf { it.price * it.quantity }
    val cartCount = cart.sumOf { it.quantity }

    Box(modifier = Modifier.fillMaxSize().background(Cream50)) {
        Column(modifier = Modifier.fillMaxSize()) {
            // 标题 + 自提/堂食
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("点单", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Brand900)
                Spacer(Modifier.weight(1f))
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Brand100)
                        .padding(4.dp),
                ) {
                    Text("自提", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Brand600,
                        modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(Cream50).padding(horizontal = 16.dp, vertical = 6.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("堂食", fontSize = 13.sp, color = Color(0xFF8A968D),
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp))
                }
            }

            // 分类 Tab
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(
                    selected = selectedCategoryId == 0,
                    onClick = { selectedCategoryId = 0 },
                    label = { Text("全部") },
                )
                categories.forEach { c ->
                    FilterChip(
                        selected = selectedCategoryId == c.id,
                        onClick = { selectedCategoryId = c.id },
                        label = { Text(c.name) },
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // 商品列表
            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Brand600)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f).padding(bottom = 100.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(filteredProducts) { p ->
                        ProductRow(
                            product = p,
                            onTap = {
                                if (p.soldOut) return@ProductRow
                                if (p.specs.isNotEmpty()) {
                                    specProduct = p
                                } else {
                                    cart = addToCart(cart, p, null, null, null)
                                }
                            },
                        )
                    }
                }
            }
        }

        // 购物车条
        if (cartCount > 0) {
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(16.dp)
                    .height(64.dp)
                    .clip(RoundedCornerShape(32.dp))
                    .background(Brand900)
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box {
                    Icon(Icons.Filled.ShoppingCart, contentDescription = null, tint = Cream50, modifier = Modifier.size(28.dp))
                    Badge(
                        modifier = Modifier.align(Alignment.TopEnd).offset(x = 8.dp, y = (-4).dp),
                        containerColor = Caramel500,
                    ) { Text("$cartCount", color = Cream50, fontSize = 11.sp) }
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(formatYuan(cartTotal), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Cream50)
                    Text("已享第二杯半价 -${formatYuan(0)}", fontSize = 11.sp, color = Cream100)
                }
                Button(
                    onClick = onGoToCheckout,
                    shape = RoundedCornerShape(24.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Caramel500),
                ) {
                    Text("去结算", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }

    // 规格弹窗
    specProduct?.let { p ->
        ModalBottomSheet(
            onDismissRequest = { specProduct = null },
            sheetState = sheetState,
        ) {
            SpecSheet(
                product = p,
                onConfirm = { cup, temperature, sugar, qty ->
                    cart = addToCart(cart, p, cup, temperature, sugar, qty)
                    specProduct = null
                },
            )
        }
    }
}

private fun addToCart(
    cart: List<CartItem>,
    product: Product,
    cup: String?,
    temperature: String?,
    sugar: String?,
    quantity: Int = 1,
): List<CartItem> {
    val price = product.price + (product.specs.find {
        it.cup == cup && it.temperature == temperature && it.sugar == sugar
    }?.priceAdjust ?: 0)
    val existing = cart.find {
        it.productId == product.id && it.cup == cup && it.temperature == temperature && it.sugar == sugar
    }
    return if (existing != null) {
        cart.map { if (it == existing) it.copy(quantity = it.quantity + quantity) else it }
    } else {
        cart + CartItem(product.id, product.name, product.image, cup, temperature, sugar, price, quantity)
    }
}

@Composable
private fun ProductRow(product: Product, onTap: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onTap() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ProductArt(image = product.image, name = product.name, size = 72.dp)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(product.name, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = Brand900)
                    if (product.specs.isNotEmpty()) {
                        Spacer(Modifier.width(6.dp))
                        Text("第二杯半价", fontSize = 10.sp, color = Caramel600,
                            modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(Color(0xFFFAF0E3)).padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
                Text(product.description ?: "", fontSize = 12.sp, color = Color(0xFF8A968D))
                Spacer(Modifier.height(4.dp))
                Text(formatYuan(product.price), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Caramel600)
            }
            if (product.soldOut) {
                Text("已售罄", fontSize = 12.sp, color = Color(0xFFB0483E),
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Color(0xFFF9ECEA)).padding(8.dp))
            } else {
                Text("选规格", fontSize = 12.sp, color = Brand600,
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Brand100).padding(8.dp))
            }
        }
    }
}

@Composable
private fun SpecSheet(
    product: Product,
    onConfirm: (String, String, String, Int) -> Unit,
) {
    var cup by remember { mutableStateOf("medium") }
    var temperature by remember { mutableStateOf("ice") }
    var sugar by remember { mutableStateOf("standard") }
    var quantity by remember { mutableStateOf(1) }

    val adjust = product.specs.find { it.cup == cup && it.temperature == temperature && it.sugar == sugar }?.priceAdjust ?: 0
    val unitPrice = product.price + adjust

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
    ) {
        Text(product.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Brand900)
        Spacer(Modifier.height(16.dp))

        SpecGroup(label = "杯型", options = listOf("medium" to "中杯", "large" to "大杯"), selected = cup, onSelect = { cup = it })
        SpecGroup(label = "温度", options = listOf("ice" to "冰", "hot" to "热"), selected = temperature, onSelect = { temperature = it })
        SpecGroup(label = "糖度", options = listOf("none" to "无糖", "less" to "少糖", "standard" to "标准糖"), selected = sugar, onSelect = { sugar = it })

        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("数量", fontSize = 14.sp, color = Brand900)
            Spacer(Modifier.weight(1f))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Remove, contentDescription = "减少", tint = Brand600,
                    modifier = Modifier.size(32.dp).clip(CircleShape).background(Brand100).clickable { if (quantity > 1) quantity-- }.padding(4.dp))
                Text("$quantity", fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp))
                Icon(Icons.Filled.Add, contentDescription = "增加", tint = Brand600,
                    modifier = Modifier.size(32.dp).clip(CircleShape).background(Brand100).clickable { quantity++ }.padding(4.dp))
            }
        }

        Spacer(Modifier.height(16.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(specText(cup, temperature, sugar), fontSize = 13.sp, color = Color(0xFF8A968D))
            Spacer(Modifier.width(8.dp))
            Text(formatYuan(unitPrice), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Caramel600)
            if (quantity > 1) {
                Text(" × $quantity = ${formatYuan(unitPrice * quantity)}", fontSize = 14.sp, color = Caramel600)
            }
        }

        Spacer(Modifier.height(20.dp))
        Button(
            onClick = { onConfirm(cup, temperature, sugar, quantity) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(26.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Brand600),
        ) {
            Text("加入购物车", fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
private fun SpecGroup(
    label: String,
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit,
) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(label, fontSize = 14.sp, color = Brand900)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            options.forEach { (value, text) ->
                FilterChip(
                    selected = selected == value,
                    onClick = { onSelect(value) },
                    label = { Text(text) },
                )
            }
        }
    }
}
