package com.shanyecoffee.app.core.data

import com.shanyecoffee.app.core.api.MemberDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** 登录会话：内存态 + DataStore 持久化 */
object SessionManager {

    data class Session(
        val token: String,
        val memberId: Int,
        val phone: String,
        val points: Int,
    )

    private val _session = MutableStateFlow<Session?>(null)
    val session: StateFlow<Session?> = _session.asStateFlow()

    val currentToken: String?
        get() = _session.value?.token

    val isLoggedIn: Boolean
        get() = _session.value != null

    private var tokenStore: TokenStore? = null

    fun attachStore(store: TokenStore) {
        tokenStore = store
    }

    suspend fun saveLogin(token: String, member: MemberDto) {
        tokenStore?.save(token, member.id, member.phone, member.points)
        _session.value = Session(token, member.id, member.phone, member.points)
    }

    suspend fun saveLogin(token: String, session: Session) {
        tokenStore?.save(token, session.memberId, session.phone, session.points)
        _session.value = session
    }

    /** 启动时恢复登录态 */
    suspend fun restore() {
        val store = tokenStore ?: return
        val saved = store.restore() ?: return
        _session.value = Session(saved.token, saved.memberId, saved.phone, saved.points)
    }

    suspend fun logout() {
        tokenStore?.clear()
        _session.value = null
    }

    /** 仅清空内存态（单元测试模拟冷启动用；不影响 DataStore 持久化） */
    internal fun clearMemory() {
        _session.value = null
    }
}
