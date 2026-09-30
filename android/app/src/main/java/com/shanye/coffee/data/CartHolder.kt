package com.shanye.coffee.data

/**
 * 购物车共享状态：点单页与确认订单页共用。
 * 内存中持有，切 Tab 或跳转后保留。
 */
object CartHolder {
    private val items = mutableListOf<CartItem>()

    fun getItems(): List<CartItem> = items.toList()

    fun addItem(item: CartItem) {
        val existing = items.find {
            it.productId == item.productId && it.cup == item.cup &&
                it.temperature == item.temperature && it.sugar == item.sugar
        }
        if (existing != null) {
            var idx = items.indexOf(existing); items.removeAt(idx); items.add(existing.copy(quantity = existing.quantity + item.quantity))
        } else {
            items.add(item.copy())
        }
    }

    fun setQuantity(item: CartItem, quantity: Int) {
        val idx = items.indexOfFirst {
            it.productId == item.productId && it.cup == item.cup &&
                it.temperature == item.temperature && it.sugar == item.sugar
        }
        if (idx < 0) return
        if (quantity <= 0) items.removeAt(idx)
        else items[idx] = items[idx].copy(quantity = quantity)
    }

    fun clear() {
        items.clear()
    }

    fun isEmpty(): Boolean = items.isEmpty()
}

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
