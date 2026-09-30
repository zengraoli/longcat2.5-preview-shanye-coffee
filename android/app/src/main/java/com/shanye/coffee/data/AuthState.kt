package com.shanye.coffee.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * 全局认证状态：登录/过期时更新，MainActivity 观察并跳转登录页。
 */
object AuthState {
    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    fun setLoggedIn(value: Boolean) {
        _isLoggedIn.value = value
    }

    /** 处理未登录：清除凭证并标记为未登录 */
    fun onUnauthorized() {
        TokenHolder.clear()
        _isLoggedIn.value = false
    }
}
