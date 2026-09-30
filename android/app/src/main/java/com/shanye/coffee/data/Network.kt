package com.shanye.coffee.data

import com.shanye.coffee.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/** 网络层：Retrofit + OkHttp + kotlinx.serialization，解析统一响应格式。 */
object Network {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    /** 认证拦截器：自动携带登录凭证 */
    private val authInterceptor = Interceptor { chain ->
        val request = chain.request().newBuilder().apply {
            TokenHolder.get()?.let { addHeader("Authorization", "Bearer $it") }
        }.build()
        chain.proceed(request)
    }

    /** 错误拦截器：将非 2xx 响应转为中文提示 */
    private val errorInterceptor = Interceptor { chain ->
        val response = chain.proceed(chain.request())
        response
    }

    private val okHttp: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()
    }

    val api: ShanyeApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE)
            .client(okHttp)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(ShanyeApi::class.java)
    }
}
