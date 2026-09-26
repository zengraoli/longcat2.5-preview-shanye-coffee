package com.shanyecoffee.app.core.util

/** 优惠券计算（与 server utils/coupon.ts 保持一致），金额单位“分” */
object CouponDiscount {

    /**
     * @param amount 券前金额（已扣除活动优惠，单位分）
     * @return 优惠金额（分）；不满足门槛返回 0
     */
    fun calculate(type: String, threshold: Int, discount: Int, amount: Int): Int {
        if (amount < threshold) return 0
        return if (type == "fixed") {
            minOf(discount, amount)
        } else {
            minOf((amount * discount) / 100, amount)
        }
    }

    /** 展示文案：满 50 减 10 / 满 30 打 8 折 */
    fun displayText(type: String, threshold: Int, discount: Int): String {
        val thresholdText = yuanText(threshold)
        return if (type == "fixed") {
            val discountText = yuanText(discount)
            "满 $thresholdText 减 $discountText"
        } else {
            val percent = (100 - discount) / 10.0
            val percentText = if (percent == percent.toInt().toDouble()) {
                percent.toInt().toString()
            } else {
                percent.toString()
            }
            "满 $thresholdText 打 ${percentText} 折"
        }
    }

    private fun yuanText(fen: Int): String {
        val yuan = PriceFormat.fenToYuan(fen).removePrefix("¥").removePrefix("-")
        return if (yuan.endsWith(".00")) yuan.dropLast(3) else yuan
    }
}
