package com.shanyecoffee.app.core.data

import com.shanyecoffee.app.core.api.LoginRequest
import com.shanyecoffee.app.core.api.LoginResponse
import com.shanyecoffee.app.core.api.MemberDto
import com.shanyecoffee.app.core.api.ShanYeClient
import com.shanyecoffee.app.core.api.apiCall

/** 会员相关接口 */
class MemberRepository {

    /** 手机号 + 验证码登录（演示环境验证码固定 123456） */
    suspend fun login(phone: String, code: String): LoginResponse = apiCall {
        ShanYeClient.api.memberLogin(LoginRequest(phone = phone, code = code))
    }

    /** 当前会员信息（手机号为脱敏格式） */
    suspend fun me(): MemberDto = apiCall {
        ShanYeClient.api.memberMe()
    }

    suspend fun logout() {
        runCatching { apiCall { ShanYeClient.api.logout() } }
    }
}
