package com.shanyecoffee.app.core.util

import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.SoldOutText
import com.shanyecoffee.app.core.ui.theme.Terracotta
import androidx.compose.ui.graphics.Color

/** 订单状态：待支付 → 已支付 → 制作中 → 待取餐 → 已完成（支付前可取消） */
object OrderStatus {

    fun label(status: String): String = when (status) {
        "pending" -> "待支付"
        "paid" -> "已支付"
        "making" -> "制作中"
        "ready" -> "待取餐"
        "done" -> "已完成"
        "cancelled" -> "已取消"
        else -> status
    }

    /** 进度步骤：已支付 / 制作中 / 待取餐 / 已完成（-1 表示不参与进度） */
    fun progressIndex(status: String): Int = when (status) {
        "paid" -> 0
        "making" -> 1
        "ready" -> 2
        "done" -> 3
        else -> -1
    }

    fun tagColor(status: String): Color = when (status) {
        "paid", "making", "ready" -> Terracotta
        "done" -> BrandGreen
        else -> SoldOutText
    }

    /** 取餐码卡片副标题（北京时间由调用方处理） */
    fun pickupSubtitle(status: String, paidAt: String?): String = when (status) {
        "paid", "making" -> "制作中 · 预计 6 分钟后可取"
        "ready" -> "待取餐 · 请凭取餐码到柜台领取"
        "done" -> "已完成 · 感谢品尝"
        "pending" -> "待支付"
        "cancelled" -> "订单已取消"
        else -> ""
    }

    fun typeLabel(type: String): String = when (type) {
        "pickup" -> "自提"
        "dine_in" -> "堂食"
        else -> type
    }
}
