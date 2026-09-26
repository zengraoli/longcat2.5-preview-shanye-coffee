package com.shanyecoffee.app.core.cart

import com.shanyecoffee.app.core.util.PromoDiscount
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** 购物车（内存态；跨“点单”与“确认订单”页面共享） */
object CartManager {

    data class Line(
        val productId: Int,
        val name: String,
        val cupSize: String,
        val temperature: String,
        val sugar: String,
        val quantity: Int,
        /** 单价，单位“分”（基础价 + 规格差价） */
        val unitPrice: Int,
    )

    private val _lines = MutableStateFlow<List<Line>>(emptyList())
    val lines: StateFlow<List<Line>> = _lines.asStateFlow()

    private val _orderType = MutableStateFlow(TYPE_PICKUP)
    val orderType: StateFlow<String> = _orderType.asStateFlow()

    val itemCount: Int
        get() = _lines.value.sumOf { it.quantity }

    /** 商品原价合计（分） */
    val originalTotal: Int
        get() = _lines.value.sumOf { it.unitPrice * it.quantity }

    fun setOrderType(type: String) {
        _orderType.value = type
    }

    /** 加入购物车（相同商品 + 规格合并数量） */
    fun add(line: Line) {
        _lines.value = _lines.value.toMutableList().apply {
            val index = indexOfFirst {
                it.productId == line.productId &&
                    it.cupSize == line.cupSize &&
                    it.temperature == line.temperature &&
                    it.sugar == line.sugar
            }
            if (index >= 0) {
                val existing = this[index]
                this[index] = existing.copy(quantity = existing.quantity + line.quantity)
            } else {
                add(line)
            }
        }
    }

    fun increment(line: Line) {
        add(line.copy(quantity = 1))
    }

    fun decrement(productId: Int, cupSize: String, temperature: String, sugar: String) {
        _lines.value = _lines.value.toMutableList().apply {
            val index = indexOfFirst {
                it.productId == productId &&
                    it.cupSize == cupSize &&
                    it.temperature == temperature &&
                    it.sugar == sugar
            }
            if (index >= 0) {
                val existing = this[index]
                if (existing.quantity <= 1) removeAt(index) else this[index] = existing.copy(quantity = existing.quantity - 1)
            }
        }
    }

    fun clear() {
        _lines.value = emptyList()
    }

    /** 第二杯半价优惠（分） */
    fun promoDiscount(promoProductIds: Set<Int>): Int = PromoDiscount.calc(
        _lines.value.map { PromoDiscount.CartLine(it.productId, it.quantity, it.unitPrice) },
        promoProductIds,
    )

    /** 优惠后应付（分） */
    fun payTotal(promoProductIds: Set<Int>): Int = originalTotal - promoDiscount(promoProductIds)

    const val TYPE_PICKUP = "pickup"
    const val TYPE_DINE_IN = "dine_in"
}
