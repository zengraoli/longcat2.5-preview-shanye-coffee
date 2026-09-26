package com.shanyecoffee.app.core.api

/** 解析统一响应：code 为 0 返回 data；未登录（1002/1003）发出全局事件后抛异常 */
suspend fun <T> apiCall(call: suspend () -> ApiResponse<T>): T {
    val response = call()
    if (response.code == 0) {
        @Suppress("UNCHECKED_CAST")
        return response.data as T
    }
    if (response.code == 1002 || response.code == 1003) {
        ShanYeClient.notifyUnauthorized()
    }
    throw ApiException(response.code, response.message)
}
