package com.shanye.coffee.data

/**
 * 内存中的登录凭证：登录时写入，退出/过期时清除。
 * 供 OkHttp 拦截器同步读取（DataStore 是异步的，拦截器无法直接 await）。
 */
object TokenHolder {
    @Volatile
    private var token: String? = null

    fun set(newToken: String?) {
        token = newToken
    }

    fun get(): String? = token

    fun clear() {
        token = null
    }
}
