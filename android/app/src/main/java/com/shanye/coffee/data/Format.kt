package com.shanye.coffee.data

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/** 金额格式化：分 → ¥xx.xx */
fun formatYuan(fen: Int): String = "¥%.2f".format(fen / 100.0)

/** 时间格式化：UTC ISO8601 → 北京时间 YYYY-MM-DD HH:mm */
fun formatBeijing(iso: String?): String {
    if (iso.isNullOrBlank()) return "-"
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        // 处理带毫秒与时区后缀的 ISO8601
        val normalized = iso
            .replace(Regex("\\.\\d+"), "")
            .replace("Z", "")
        val date = parser.parse(iso.substringBefore('.').replace("Z", "")) ?: return "-"
        val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("Asia/Shanghai")
        }
        formatter.format(date)
    } catch (e: Exception) {
        "-"
    }
}

/** 手机号脱敏：138****1234 */
fun maskPhone(phone: String?): String {
    if (phone.isNullOrBlank()) return "-"
    if (phone.length < 7) return phone
    return "${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}"
}

/** 规格中文描述；非饮品返回空串 */
fun specText(cup: String?, temperature: String?, sugar: String?): String {
    if (cup == null && temperature == null && sugar == null) return ""
    val cupText = when (cup) {
        "large" -> "大杯"
        else -> "中杯"
    }
    val tempText = when (temperature) {
        "ice" -> "冰"
        else -> "热"
    }
    val sugarText = when (sugar) {
        "none" -> "无糖"
        "less" -> "少糖"
        else -> "标准糖"
    }
    return "$cupText·$tempText·$sugarText"
}

/** 订单状态中文 */
fun orderStatusText(status: String): String = when (status) {
    "pending_payment" -> "待支付"
    "paid" -> "已支付"
    "making" -> "制作中"
    "ready" -> "待取餐"
    "completed" -> "已完成"
    "cancelled" -> "已取消"
    else -> status
}

/**
 * 优惠券优惠金额（分）：与 server 的 computeDiscount 保持一致。
 * 满减券：原价 >= 门槛时减 discountAmount；
 * 折扣券：优惠 = 原价 × (100 - 折扣率) / 100，向下取整到分。
 */
fun couponDiscount(template: Coupon, originalAmount: Int): Int {
    if (originalAmount <= 0) return 0
    return when (template.type) {
        "full_reduction" -> {
            if (originalAmount < template.threshold) 0
            else template.discountAmount ?: 0
        }
        else -> {
            val rate = template.discountRate ?: 100
            if (rate <= 0 || rate >= 100) 0
            else (originalAmount * (100 - rate)) / 100
        }
    }
}

/** 会员等级进度（0-100） */
fun levelProgress(points: Int, level: String): Int = when (level) {
    "black" -> 100
    "gold" -> minOf(100, ((points - 500) / 1500.0 * 100).toInt())
    else -> minOf(100, (points / 500.0 * 100).toInt())
}
