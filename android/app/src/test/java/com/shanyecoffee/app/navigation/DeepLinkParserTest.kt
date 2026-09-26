package com.shanyecoffee.app.navigation

import android.net.Uri
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DeepLinkParserTest {

    @Test
    fun `合法 deep link 解析为路由`() {
        assertEquals(
            Routes.LOGIN,
            DeepLinkParser.parse(Uri.parse("shanye://login")),
        )
        assertEquals(
            Routes.HOME,
            DeepLinkParser.parse(Uri.parse("shanye://home")),
        )
        assertEquals(
            Routes.ORDER,
            DeepLinkParser.parse(Uri.parse("shanye://order")),
        )
        assertEquals(
            Routes.CHECKOUT,
            DeepLinkParser.parse(Uri.parse("shanye://checkout")),
        )
        assertEquals(
            Routes.ORDERS,
            DeepLinkParser.parse(Uri.parse("shanye://orders")),
        )
        assertEquals(
            Routes.PROFILE,
            DeepLinkParser.parse(Uri.parse("shanye://profile")),
        )
    }

    @Test
    fun `非法 deep link 返回 null`() {
        assertNull(DeepLinkParser.parse(Uri.parse("http://home")))
        assertNull(DeepLinkParser.parse(Uri.parse("shanye://unknown")))
        assertNull(DeepLinkParser.parse(null))
        assertNull(DeepLinkParser.parse(Uri.parse("shanye://")))
    }
}
