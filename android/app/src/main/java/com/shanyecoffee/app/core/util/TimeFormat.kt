package com.shanyecoffee.app.core.util

/** 时间一律以 UTC ISO8601 存储与传输，界面按北京时间（UTC+8）显示 */
object TimeFormat {

    private fun parseBeijing(iso: String): java.time.ZonedDateTime? =
        runCatching {
            java.time.Instant.parse(iso).atZone(java.time.ZoneId.of("Asia/Shanghai"))
        }.getOrNull()

    /** "2026-09-26 14:32" 北京时间 */
    fun isoToBeijingDateTime(iso: String): String {
        val bj = parseBeijing(iso) ?: return iso
        return String.format(
            java.util.Locale.CHINA,
            "%04d-%02d-%02d %02d:%02d",
            bj.year, bj.monthValue, bj.dayOfMonth, bj.hour, bj.minute,
        )
    }

    /** "9月19日 - 9月30日" 北京时间 */
    fun isoRangeToBeijing(startIso: String, endIso: String): String {
        val fmt = fmt@ { iso: String ->
            val bj = parseBeijing(iso) ?: return@fmt iso
            "${bj.monthValue}月${bj.dayOfMonth}日"
        }
        return "${fmt(startIso)} - ${fmt(endIso)}"
    }

    /** "09-26 14:32" 北京时间（订单列表） */
    fun isoToBeijingShort(iso: String): String {
        val bj = parseBeijing(iso) ?: return iso
        return String.format(
            java.util.Locale.CHINA,
            "%02d-%02d %02d:%02d",
            bj.monthValue, bj.dayOfMonth, bj.hour, bj.minute,
        )
    }
}
