package com.shanyecoffee.app.core.api

import android.content.Context
import com.shanyecoffee.app.BuildConfig
import com.shanyecoffee.app.core.data.SessionManager
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/** 网络层单例：OkHttp + Retrofit + kotlinx.serialization */
object ShanYeClient {

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
    }

    private val _unauthorized = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    /** 接口返回未登录（1002/1003）时发出事件，由 MainActivity 统一跳转登录页 */
    val unauthorized: SharedFlow<Unit> = _unauthorized

    @Volatile
    private var service: ShanYeApiService? = null

    val api: ShanYeApiService
        get() = checkNotNull(service) { "ShanYeClient 未初始化" }

    /** 发出未登录事件（接口返回 1002/1003 时调用） */
    fun notifyUnauthorized() {
        _unauthorized.tryEmit(Unit)
    }

    fun init(context: Context) {
        if (service != null) return
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val builder = chain.request().newBuilder()
                SessionManager.currentToken?.let { token ->
                    builder.header("Authorization", "Bearer $token")
                }
                chain.proceed(builder.build())
            }
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) {
                        HttpLoggingInterceptor.Level.BASIC
                    } else {
                        HttpLoggingInterceptor.Level.NONE
                    }
                },
            )
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        service = retrofit.create(ShanYeApiService::class.java)
    }
}
