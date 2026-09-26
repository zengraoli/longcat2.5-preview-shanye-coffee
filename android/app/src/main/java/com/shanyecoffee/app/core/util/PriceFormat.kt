package com.shanyecoffee.app.core.util

import java.util.Locale

/** 金额在界面层一律格式化为 ¥xx.xx（存储与传输均为整数“分”） */
object PriceFormat {

    fun fenToYuan(fen: Int): String {
        val yuan = fen / 100
        val remainder = (fen % 100).let { if (it < 0) -it else it }
        return String.format(Locale.CHINA, "¥%d.%02d", yuan, remainder)
    }
}
