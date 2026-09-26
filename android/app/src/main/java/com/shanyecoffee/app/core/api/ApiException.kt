package com.shanyecoffee.app.core.api

/** 业务异常：code 非 0 时抛出，message 为中文原因 */
class ApiException(
    val code: Int,
    override val message: String,
) : Exception(message)
