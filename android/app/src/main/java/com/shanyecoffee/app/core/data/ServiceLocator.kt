package com.shanyecoffee.app.core.data

import android.content.Context

/** 简单的服务定位器（替代 DI 框架，保持骨架轻量） */
object ServiceLocator {

    lateinit var appContext: Context
        private set

    fun init(context: Context) {
        appContext = context
    }

    val storePreferences: StorePreferences by lazy { StorePreferences(appContext) }
}
