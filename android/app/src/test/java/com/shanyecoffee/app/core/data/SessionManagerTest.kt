package com.shanyecoffee.app.core.data

import androidx.test.core.app.ApplicationProvider
import com.shanyecoffee.app.core.api.MemberDto
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SessionManagerTest {

    private val context = ApplicationProvider.getApplicationContext<android.app.Application>()

    @Before
    fun setUp() = runBlocking {
        SessionManager.attachStore(TokenStore(context))
        SessionManager.logout()
    }

    @Test
    fun `保存登录态后 token 与会话立即可用`() = runBlocking {
        SessionManager.saveLogin("demo-token", MemberDto(7, "138****1234", 286))

        assertTrue(SessionManager.isLoggedIn)
        assertEquals("demo-token", SessionManager.currentToken)
        assertEquals(286, SessionManager.session.value?.points)
    }

    @Test
    fun `退出登录后清空会话`() = runBlocking {
        SessionManager.saveLogin("demo-token", MemberDto(7, "138****1234", 286))
        SessionManager.logout()

        assertFalse(SessionManager.isLoggedIn)
        assertNull(SessionManager.currentToken)
    }

    @Test
    fun `重启后从 DataStore 恢复登录态`() = runBlocking {
        SessionManager.saveLogin("demo-token", MemberDto(7, "138****1234", 286))
        // 模拟冷启动：仅清空内存态，存储不动
        SessionManager.clearMemory()
        assertFalse(SessionManager.isLoggedIn)
        SessionManager.restore()

        assertTrue(SessionManager.isLoggedIn)
        assertEquals("demo-token", SessionManager.currentToken)
        assertEquals(7, SessionManager.session.value?.memberId)
        assertEquals("138****1234", SessionManager.session.value?.phone)
    }
}
