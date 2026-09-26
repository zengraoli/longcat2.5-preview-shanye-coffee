package com.shanyecoffee.app.core.util

import org.junit.Assert.assertEquals
import org.junit.Test

class PriceFormatTest {

    @Test
    fun `分转换为元并保留两位小数`() {
        assertEquals("¥0.00", PriceFormat.fenToYuan(0))
        assertEquals("¥0.01", PriceFormat.fenToYuan(1))
        assertEquals("¥0.99", PriceFormat.fenToYuan(99))
        assertEquals("¥1.00", PriceFormat.fenToYuan(100))
        assertEquals("¥2.50", PriceFormat.fenToYuan(250))
        assertEquals("¥28.00", PriceFormat.fenToYuan(2800))
        assertEquals("¥129.00", PriceFormat.fenToYuan(12900))
    }

    @Test
    fun `大金额正确格式化`() {
        assertEquals("¥1234.56", PriceFormat.fenToYuan(123456))
        assertEquals("¥10000.00", PriceFormat.fenToYuan(1000000))
    }

    @Test
    fun `负数金额用于优惠展示`() {
        assertEquals("-¥14.00", PriceFormat.fenToYuan(-1400))
        assertEquals("-¥0.05", PriceFormat.fenToYuan(-5))
    }

    @Test
    fun `优惠券展示文案`() {
        // 满减券：满 50 减 10
        assertEquals("满 50 减 10", CouponDiscount.displayText("fixed", 5000, 1000))
        assertEquals("满 20 减 5", CouponDiscount.displayText("fixed", 2000, 500))
        // 折扣券：discount 20 表示减免 20%，即打 8 折
        assertEquals("满 30 打 8 折", CouponDiscount.displayText("percent", 3000, 20))
        assertEquals("满 30 打 8.5 折", CouponDiscount.displayText("percent", 3000, 15))
    }

    @Test
    fun `优惠券优惠金额与 server 一致`() {
        // 未达门槛不优惠
        assertEquals(0, CouponDiscount.calculate("fixed", 5000, 1000, 4200))
        // 满减券 min(discount, amount)
        assertEquals(500, CouponDiscount.calculate("fixed", 2000, 500, 4200))
        // 折扣券 floor(amount * discount / 100)
        assertEquals(840, CouponDiscount.calculate("percent", 3000, 20, 4200))
        // 优惠不超过金额本身
        assertEquals(300, CouponDiscount.calculate("fixed", 0, 500, 300))
    }

    @Test
    fun `会员等级与升级进度`() {
        assertEquals("银卡会员", MemberLevels.of(0).name)
        assertEquals("金卡会员", MemberLevels.of(500).name)
        assertEquals("金卡会员", MemberLevels.of(1999).name)
        assertEquals("黑卡会员", MemberLevels.of(2000).name)
        assertEquals(0.5f, MemberLevels.progress(250), 0.001f)
        assertEquals(1.0f, MemberLevels.progress(2000), 0.001f)
        assertEquals(1.0f, MemberLevels.progress(5000), 0.001f)
        assertEquals("再积 500 分升级金卡", MemberLevels.nextLevelHint(0))
        assertEquals("再积 714 分升级黑卡", MemberLevels.nextLevelHint(1286))
        assertEquals("已达最高等级", MemberLevels.nextLevelHint(2000))
    }
}
