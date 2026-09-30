package com.shanye.coffee.data

/** 仓库：解包统一响应，处理未登录（1003/2004）与错误。 */
open class Repository(protected val sessionStore: SessionStore) {

    companion object {
        const val CODE_UNAUTHORIZED = 1003
        const val CODE_UNAUTHORIZED_ALT = 2004
    }

    /** 解包 ApiResult，未登录时清除会话并抛 UnauthorizedException。 */
    protected suspend fun <T> unwrap(result: ApiResult<T>): T {
        if (result.code == 0) return result.data
        if (result.code == CODE_UNAUTHORIZED || result.code == CODE_UNAUTHORIZED_ALT) {
            sessionStore.clear()
            TokenHolder.clear()
            throw UnauthorizedException(result.message)
        }
        throw ApiException(result.code, result.message)
    }

    open suspend fun login(phone: String, code: String): LoginResponse {
        val res = unwrap(Network.api.login(mapOf("phone" to phone, "code" to code)))
        // 同步写入 TokenHolder，供拦截器读取
        TokenHolder.set(res.token)
        sessionStore.save(res.token, res.member)
        return res
    }

    open suspend fun me(): Member = unwrap(Network.api.me())

    open suspend fun myCoupons(): List<Coupon> = unwrap(Network.api.myCoupons())

    open suspend fun stores(): List<Store> = unwrap(Network.api.stores())

    open suspend fun categories(): List<Category> = unwrap(Network.api.categories())

    open suspend fun products(): List<Product> = unwrap(Network.api.products())

    open suspend fun product(id: Int): Product = unwrap(Network.api.product(id))

    open suspend fun activePromotions(): ActivePromotions = unwrap(Network.api.activePromotions())

    open suspend fun orders(): List<Order> = unwrap(Network.api.orders())

    open suspend fun order(id: Int): Order = unwrap(Network.api.order(id))

    open suspend fun createOrder(request: CreateOrderRequest): Order =
        unwrap(Network.api.createOrder(request))

    open suspend fun pay(id: Int): Order = unwrap(Network.api.pay(id))

    open suspend fun cancel(id: Int): Order = unwrap(Network.api.cancel(id))

    open suspend fun logout() {
        sessionStore.clear()
        TokenHolder.clear()
    }
}

class ApiException(val code: Int, message: String) : Exception(message)
class UnauthorizedException(message: String) : Exception(message)
