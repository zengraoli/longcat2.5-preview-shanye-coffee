package com.shanyecoffee.app.core.util

import java.util.Locale

/** 金额在界面层一律格式化为 ¥xx.xx（存储与传输均为整数“分”） */
object PriceFormat {

    fun fenToYuan(fen: Int): String {
        val sign = if (fen < 0) "-" else ""
        val abs = if (fen < 0) -fen else fen
        return String.format(Locale.CHINA, "%s¥%d.%02d", sign, abs / 100, abs % 100)
    }
}
