package com.shanyecoffee.app

import android.app.Application
import com.shanyecoffee.app.core.api.ShanYeClient
import com.shanyecoffee.app.core.data.SessionManager
import com.shanyecoffee.app.core.data.TokenStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class ShanYeApplication : Application() {

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        ShanYeClient.init(this)
        SessionManager.attachStore(TokenStore(this))
        appScope.launch { SessionManager.restore() }
    }
}
