package com.shanyecoffee.app.core.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ---------- 登录 ----------

@Serializable
data class LoginRequest(
    val phone: String,
    val code: String,
)

@Serializable
data class LoginResponse(
    val token: String,
    val member: MemberDto,
)

@Serializable
data class MemberDto(
    val id: Int,
    val phone: String,
    val points: Int,
)

// ---------- 门店 ----------

@Serializable
data class StoreDto(
    val id: Int,
    val name: String,
    val address: String,
    val phone: String,
    @SerialName("openTime") val openTime: String,
    @SerialName("closeTime") val closeTime: String,
    val status: String,
)

// ---------- 商品 ----------

@Serializable
data class CategoryDto(
    val id: Int,
    val name: String,
    @SerialName("sort_order") val sortOrder: Int = 0,
)

@Serializable
data class ProductDto(
    val id: Int,
    @SerialName("categoryId") val categoryId: Int,
    val name: String,
    val description: String,
    /** 单价，单位“分” */
    val price: Int,
    @SerialName("soldOut") val soldOut: Boolean,
)

@Serializable
data class ProductDetailDto(
    val id: Int,
    @SerialName("categoryId") val categoryId: Int,
    val name: String,
    val description: String,
    val price: Int,
    val status: String,
    @SerialName("soldOut") val soldOut: Boolean,
    val specs: List<ProductSpecDto>,
)

@Serializable
data class ProductSpecDto(
    @SerialName("cup_size") val cupSize: String,
    val temperature: String,
    val sugar: String,
    @SerialName("price_delta") val priceDelta: Int,
)

// ---------- 活动 ----------

@Serializable
data class ActivePromotionDto(
    val id: Int,
    val name: String,
    @SerialName("startTime") val startTime: String,
    @SerialName("endTime") val endTime: String,
    @SerialName("productIds") val productIds: List<Int>,
    val products: List<ProductDto>,
)

// ---------- 优惠券 ----------

@Serializable
data class CouponDto(
    val id: Int,
    val name: String,
    val type: String,
    val threshold: Int,
    val discount: Int,
    @SerialName("validFrom") val validFrom: String,
    @SerialName("validTo") val validTo: String,
    val valid: Boolean,
)

@Serializable
data class UserCouponDto(
    val id: Int,
    val status: String,
    @SerialName("claimedAt") val claimedAt: String? = null,
    val coupon: CouponDto,
)

@Serializable
data class BestCouponRequest(
    val amount: Int,
)

@Serializable
data class BestCouponDto(
    @SerialName("userCouponId") val userCouponId: Int,
    @SerialName("couponId") val couponId: Int,
    val name: String,
    val type: String,
    val threshold: Int,
    val discount: Int,
)

// ---------- 订单 ----------

@Serializable
data class OrderItemInput(
    @SerialName("productId") val productId: Int,
    val quantity: Int,
    val cupSize: String,
    val temperature: String,
    val sugar: String,
)

@Serializable
data class CreateOrderRequest(
    @SerialName("storeId") val storeId: Int,
    val type: String,
    val items: List<OrderItemInput>,
    @SerialName("userCouponId") val userCouponId: Int? = null,
)

@Serializable
data class CreateOrderResponse(
    val id: Int,
    @SerialName("orderNo") val orderNo: String,
    @SerialName("pickupCode") val pickupCode: String,
    val status: String,
    @SerialName("originalAmount") val originalAmount: Int,
    @SerialName("discountAmount") val discountAmount: Int,
    @SerialName("paidAmount") val paidAmount: Int,
)

@Serializable
data class OrderListDto(
    val id: Int,
    @SerialName("order_no") val orderNo: String,
    @SerialName("pickup_code") val pickupCode: String,
    val type: String,
    val status: String,
    @SerialName("original_amount") val originalAmount: Int,
    @SerialName("discount_amount") val discountAmount: Int,
    @SerialName("paid_amount") val paidAmount: Int,
    @SerialName("points_earned") val pointsEarned: Int = 0,
    @SerialName("promo_discount") val promoDiscount: Int = 0,
    @SerialName("created_at") val createdAt: String,
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("cancelled_at") val cancelledAt: String? = null,
    @SerialName("store_id") val storeId: Int,
    @SerialName("store_name") val storeName: String,
)

@Serializable
data class OrderItemDto(
    val id: Int,
    @SerialName("product_id") val productId: Int,
    @SerialName("product_name") val productName: String,
    @SerialName("cup_size") val cupSize: String,
    val temperature: String,
    val sugar: String,
    val quantity: Int,
    @SerialName("unit_price") val unitPrice: Int,
)

@Serializable
data class OrderDetailDto(
    val id: Int,
    @SerialName("order_no") val orderNo: String,
    @SerialName("pickup_code") val pickupCode: String,
    val type: String,
    val status: String,
    @SerialName("original_amount") val originalAmount: Int,
    @SerialName("discount_amount") val discountAmount: Int,
    @SerialName("paid_amount") val paidAmount: Int,
    @SerialName("points_earned") val pointsEarned: Int = 0,
    @SerialName("promo_discount") val promoDiscount: Int = 0,
    @SerialName("created_at") val createdAt: String,
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("cancelled_at") val cancelledAt: String? = null,
    @SerialName("store_id") val storeId: Int,
    @SerialName("store_name") val storeName: String,
    val items: List<OrderItemDto>,
)

@Serializable
data class PayResponse(
    val id: Int,
    val status: String,
    @SerialName("paidAt") val paidAt: String,
    @SerialName("pointsEarned") val pointsEarned: Int,
    val level: String,
)
