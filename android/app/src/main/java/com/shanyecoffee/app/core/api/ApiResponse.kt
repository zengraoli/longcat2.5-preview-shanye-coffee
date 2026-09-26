package com.shanyecoffee.app.core.api

import kotlinx.serialization.Serializable

/** 统一响应格式：{"code":0,"data":...,"message":"ok"} */
@Serializable
data class ApiResponse<T>(
    val code: Int = 0,
    val data: T? = null,
    val message: String = "ok",
)
