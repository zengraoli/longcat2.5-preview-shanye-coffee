package com.shanye.coffee.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** 统一响应格式 */
@Serializable
data class ApiResult<T>(
    val code: Int,
    val data: T,
    val message: String,
)

@Serializable
data class Store(
    val id: Int,
    val name: String,
    val address: String,
    val phone: String? = null,
    val openTime: String,
    val closeTime: String,
    val status: String,
    val isOpen: Boolean,
)

@Serializable
data class Category(
    val id: Int,
    val name: String,
)

@Serializable
data class ProductSpec(
    val cup: String,
    val temperature: String,
    val sugar: String,
    val priceAdjust: Int,
)

@Serializable
data class Product(
    val id: Int,
    val categoryId: Int,
    val name: String,
    val description: String? = null,
    val price: Int,
    val image: String? = null,
    val soldOut: Boolean,
    val specs: List<ProductSpec> = emptyList(),
)

@Serializable
data class Member(
    val id: Int,
    val phone: String,
    val nickname: String? = null,
    val points: Int,
    val level: LevelInfo,
)

@Serializable
data class LevelInfo(
    val level: String,
    val name: String,
    val points: Int,
    val nextLevel: String? = null,
    val pointsToNext: Int? = null,
)

@Serializable
data class LoginResponse(
    val token: String,
    val member: Member,
)

@Serializable
data class OrderItem(
    val id: Int,
    val productId: Int,
    val productName: String,
    val cup: String? = null,
    val temperature: String? = null,
    val sugar: String? = null,
    val price: Int,
    val quantity: Int,
)

@Serializable
data class Order(
    val id: Int,
    val orderNo: String,
    val storeId: Int,
    val type: String,
    val status: String,
    val pickupCode: String? = null,
    val originalAmount: Int,
    val promoDiscountAmount: Int = 0,
    val discountAmount: Int,
    val payableAmount: Int,
    val remark: String? = null,
    val createdAt: String,
    val paidAt: String? = null,
    val cancelledAt: String? = null,
    val items: List<OrderItem> = emptyList(),
)

@Serializable
data class Coupon(
    val id: Int,
    val templateId: Int,
    val name: String,
    val type: String,
    val threshold: Int,
    val discountAmount: Int? = null,
    val discountRate: Int? = null,
    val status: String,
    val expiresAt: String,
    val usable: Boolean,
)

@Serializable
data class CreateOrderRequest(
    val storeId: Int,
    val type: String,
    val items: List<OrderItemRequest>,
    val couponId: Int? = null,
    val remark: String? = null,
)

@Serializable
data class OrderItemRequest(
    val productId: Int,
    val cup: String? = null,
    val temperature: String? = null,
    val sugar: String? = null,
    val quantity: Int,
)

@Serializable
data class Promotion(
    val id: Int,
    val name: String,
    val type: String,
    val startAt: String,
    val endAt: String,
)

@Serializable
data class ActivePromotions(
    val promotions: List<Promotion>,
    val applicableProductIds: List<Int>,
)
