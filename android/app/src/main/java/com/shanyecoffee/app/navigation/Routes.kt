package com.shanyecoffee.app.navigation

import android.net.Uri

/** 页面路由与 deep link（shanye://<页面>） */
object Routes {
    const val LOGIN = "login"
    const val HOME = "home"
    const val ORDER = "order"
    const val CHECKOUT = "checkout"
    const val ORDERS = "orders"
    const val ORDER_DETAIL = "orderDetail/{orderId}"
    const val PROFILE = "profile"

    const val ARG_ORDER_ID = "orderId"

    fun orderDetail(orderId: Int): String = "orderDetail/$orderId"

    /** 底部导航四个 Tab */
    val tabs = listOf(HOME, ORDER, ORDERS, PROFILE)
}

/** 把 shanye://<页面> 的 deep link 解析为路由；无法识别时返回 null */
object DeepLinkParser {

    private val knownPages = setOf(
        Routes.LOGIN,
        Routes.HOME,
        Routes.ORDER,
        Routes.CHECKOUT,
        Routes.ORDERS,
        Routes.PROFILE,
    )

    fun parse(uri: Uri?): String? {
        if (uri == null || uri.scheme != "shanye") return null
        val page = uri.host ?: return null
        return if (page in knownPages) page else null
    }
}
