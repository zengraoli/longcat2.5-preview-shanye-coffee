package com.shanyecoffee.app.core.util

/** 会员等级：银卡（0 分）、金卡（500 分）、黑卡（2000 分） */
object MemberLevels {

    data class LevelInfo(
        /** 等级名：银卡会员 / 金卡会员 / 黑卡会员 */
        val name: String,
        /** 当前等级起始分 */
        val floor: Int,
        /** 下一等级起始分；黑卡为 null */
        val nextFloor: Int?,
    )

    fun of(points: Int): LevelInfo = when {
        points >= 2000 -> LevelInfo("黑卡会员", 2000, null)
        points >= 500 -> LevelInfo("金卡会员", 500, 2000)
        else -> LevelInfo("银卡会员", 0, 500)
    }

    /** 等级进度 0..1 */
    fun progress(points: Int): Float {
        val level = of(points)
        val next = level.nextFloor ?: return 1f
        return ((points - level.floor).toFloat() / (next - level.floor)).coerceIn(0f, 1f)
    }

    /** 下一等级名；黑卡返回空串 */
    fun nextLevelName(points: Int): String = when {
        points >= 2000 -> ""
        points >= 500 -> "黑卡"
        else -> "金卡"
    }

    /** “再积 X 分升级Y”；黑卡返回“已达最高等级” */
    fun nextLevelHint(points: Int): String {
        val next = of(points).nextFloor ?: return "已达最高等级"
        return "再积 ${next - points} 分升级${nextLevelName(points)}"
    }
}
