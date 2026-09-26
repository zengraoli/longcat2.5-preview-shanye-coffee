package com.shanyecoffee.app.core.data

import com.shanyecoffee.app.core.api.CreateOrderRequest
import com.shanyecoffee.app.core.api.CreateOrderResponse
import com.shanyecoffee.app.core.api.OrderDetailDto
import com.shanyecoffee.app.core.api.OrderItemInput
import com.shanyecoffee.app.core.api.OrderListDto
import com.shanyecoffee.app.core.api.PayResponse
import com.shanyecoffee.app.core.api.ShanYeClient
import com.shanyecoffee.app.core.api.apiCall

/** 订单接口 */
class OrderRepository {

    suspend fun createOrder(
        storeId: Int,
        type: String,
        items: List<CartLine>,
        userCouponId: Int?,
    ): CreateOrderResponse = apiCall {
        ShanYeClient.api.createOrder(
            CreateOrderRequest(
                storeId = storeId,
                type = type,
                items = items.map {
                    OrderItemInput(
                        productId = it.productId,
                        quantity = it.quantity,
                        cupSize = it.cupSize,
                        temperature = it.temperature,
                        sugar = it.sugar,
                    )
                },
                userCouponId = userCouponId,
            ),
        )
    }

    suspend fun payOrder(orderId: Int): PayResponse = apiCall {
        ShanYeClient.api.payOrder(orderId)
    }

    suspend fun cancelOrder(orderId: Int): Map<String, String> = apiCall {
        ShanYeClient.api.cancelOrder(orderId)
    }

    suspend fun orders(status: String? = null): List<OrderListDto> = apiCall {
        ShanYeClient.api.orders(status)
    }

    suspend fun orderDetail(orderId: Int): OrderDetailDto = apiCall {
        ShanYeClient.api.orderDetail(orderId)
    }
}

data class CartLine(
    val productId: Int,
    val quantity: Int,
    val unitPrice: Int,
    val cupSize: String,
    val temperature: String,
    val sugar: String,
)
