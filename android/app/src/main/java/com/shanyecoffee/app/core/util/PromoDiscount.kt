package com.shanyecoffee.app.core.util

/** 第二杯半价活动优惠计算（与 server 算法保持一致） */
object PromoDiscount {

    /**
     * 同一活动商品按商品分组，总件数每满 2 件，对单价较高的件减免半价
     * （等价于 server：按单价从高到低，对 floor(总件数/2) 件各减 floor(unitPrice/2)）。
     * 金额单位“分”。
     */
    fun calc(items: List<CartLine>, promoProductIds: Set<Int>): Int {
        if (promoProductIds.isEmpty()) return 0
        val groups = mutableMapOf<Int, MutableList<CartLine>>()
        for (item in items) {
            if (item.productId !in promoProductIds) continue
            groups.getOrPut(item.productId) { mutableListOf() }.add(item)
        }
        var discount = 0
        for (group in groups.values) {
            val totalQty = group.sumOf { it.quantity }
            var halfQty = totalQty / 2
            if (halfQty <= 0) continue
            val sorted = group.sortedByDescending { it.unitPrice }
            for (item in sorted) {
                if (halfQty <= 0) break
                val deduct = minOf(item.quantity, halfQty)
                discount += (item.unitPrice * deduct) / 2
                halfQty -= deduct
            }
        }
        return discount
    }

    data class CartLine(
        val productId: Int,
        val quantity: Int,
        val unitPrice: Int,
    )
}
