package com.shanyecoffee.app.core.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ShanYeApiService {

    @POST("member/login")
    suspend fun memberLogin(@Body body: LoginRequest): ApiResponse<LoginResponse>

    @POST("auth/logout")
    suspend fun logout(): ApiResponse<Unit?>

    @GET("member/me")
    suspend fun memberMe(): ApiResponse<MemberDto>

    @GET("stores")
    suspend fun stores(): ApiResponse<List<StoreDto>>

    @GET("categories")
    suspend fun categories(): ApiResponse<List<CategoryDto>>

    @GET("products")
    suspend fun products(@Query("categoryId") categoryId: Int? = null): ApiResponse<List<ProductDto>>

    @GET("products/{id}")
    suspend fun productDetail(@Path("id") id: Int): ApiResponse<ProductDetailDto>

    @GET("promotions/active")
    suspend fun activePromotion(): ApiResponse<ActivePromotionDto?>

    @GET("coupons")
    suspend fun coupons(): ApiResponse<List<CouponDto>>

    @GET("my/coupons")
    suspend fun myCoupons(): ApiResponse<List<UserCouponDto>>

    @POST("coupons/best")
    suspend fun bestCoupon(@Body body: BestCouponRequest): ApiResponse<BestCouponDto?>

    @POST("orders")
    suspend fun createOrder(@Body body: CreateOrderRequest): ApiResponse<CreateOrderResponse>

    @GET("orders")
    suspend fun orders(@Query("status") status: String? = null): ApiResponse<List<OrderListDto>>

    @GET("orders/{id}")
    suspend fun orderDetail(@Path("id") id: Int): ApiResponse<OrderDetailDto>

    @POST("orders/{id}/pay")
    suspend fun payOrder(@Path("id") id: Int): ApiResponse<PayResponse>

    @POST("orders/{id}/cancel")
    suspend fun cancelOrder(@Path("id") id: Int): ApiResponse<Map<String, String>>
}
