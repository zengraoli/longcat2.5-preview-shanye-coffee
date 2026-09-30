package com.shanye.coffee.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/** server 接口定义。所有响应为 ApiResult<T>，由 Repository 解包。 */
interface ShanyeApi {

    @POST("/api/member/login")
    suspend fun login(@Body body: Map<String, String>): ApiResult<LoginResponse>

    @GET("/api/member/me")
    suspend fun me(): ApiResult<Member>

    @GET("/api/member/coupons")
    suspend fun myCoupons(): ApiResult<List<Coupon>>

    @GET("/api/stores")
    suspend fun stores(): ApiResult<List<Store>>

    @GET("/api/categories")
    suspend fun categories(): ApiResult<List<Category>>

    @GET("/api/products")
    suspend fun products(): ApiResult<List<Product>>

    @GET("/api/products/{id}")
    suspend fun product(@Path("id") id: Int): ApiResult<Product>

    @GET("/api/promotions")
    suspend fun activePromotions(): ApiResult<ActivePromotions>

    @GET("/api/orders")
    suspend fun orders(): ApiResult<List<Order>>

    @GET("/api/orders/{id}")
    suspend fun order(@Path("id") id: Int): ApiResult<Order>

    @POST("/api/orders")
    suspend fun createOrder(@Body body: CreateOrderRequest): ApiResult<Order>

    @POST("/api/orders/{id}/pay")
    suspend fun pay(@Path("id") id: Int): ApiResult<Order>

    @POST("/api/orders/{id}/cancel")
    suspend fun cancel(@Path("id") id: Int): ApiResult<Order>
}
