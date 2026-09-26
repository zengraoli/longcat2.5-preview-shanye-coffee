package com.shanyecoffee.app.core.util

import com.shanyecoffee.app.core.util.PromoDiscount.CartLine
import org.junit.Assert.assertEquals
import org.junit.Test

class PromoDiscountTest {

    @Test
    fun `两件同价商品第二件半价`() {
        val discount = PromoDiscount.calc(
            listOf(CartLine(productId = 1, quantity = 2, unitPrice = 2800)),
            setOf(1),
        )
        assertEquals(1400, discount)
    }

    @Test
    fun `三件商品只免一件半价`() {
        val discount = PromoDiscount.calc(
            listOf(CartLine(productId = 1, quantity = 3, unitPrice = 2800)),
            setOf(1),
        )
        assertEquals(1400, discount)
    }

    @Test
    fun `非活动商品不参与半价`() {
        val discount = PromoDiscount.calc(
            listOf(
                CartLine(productId = 1, quantity = 2, unitPrice = 2800),
                CartLine(productId = 9, quantity = 2, unitPrice = 2800),
            ),
            setOf(1),
        )
        assertEquals(1400, discount)
    }

    @Test
    fun `多商品多规格时按单价从高到低减免`() {
        val discount = PromoDiscount.calc(
            listOf(
                CartLine(productId = 1, quantity = 1, unitPrice = 3200),
                CartLine(productId = 1, quantity = 1, unitPrice = 2800),
                CartLine(productId = 1, quantity = 1, unitPrice = 3000),
            ),
            setOf(1),
        )
        // floor(3/2)=1 件半价，单价最高（3200）减免 1600
        assertEquals(1600, discount)
    }

    @Test
    fun `无活动时优惠为 0`() {
        val discount = PromoDiscount.calc(
            listOf(CartLine(productId = 1, quantity = 2, unitPrice = 2800)),
            emptySet(),
        )
        assertEquals(0, discount)
    }
}
