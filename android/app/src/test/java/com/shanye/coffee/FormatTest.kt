package com.shanye.coffee

import com.shanye.coffee.data.Coupon
import com.shanye.coffee.data.couponDiscount
import com.shanye.coffee.data.formatBeijing
import com.shanye.coffee.data.formatYuan
import com.shanye.coffee.data.levelProgress
import com.shanye.coffee.data.maskPhone
import com.shanye.coffee.data.orderStatusText
import com.shanye.coffee.data.specText
import org.junit.Assert.assertEquals
import org.junit.Test

class FormatTest {

    @Test
    fun `formatYuan 分转元`() {
        assertEquals("¥0.00", formatYuan(0))
        assertEquals("¥1.00", formatYuan(100))
        assertEquals("¥28.00", formatYuan(2800))
        assertEquals("¥58.50", formatYuan(5850))
    }

    @Test
    fun `formatBeijing UTC 转北京时间`() {
        // UTC 2026-09-30T16:00:00Z → 北京时间 2026-10-01 00:00
        assertEquals("2026-10-01 00:00", formatBeijing("2026-09-30T16:00:00.000Z"))
        // UTC 2026-09-30T01:54:58Z → 北京时间 2026-09-30 09:54
        assertEquals("2026-09-30 09:54", formatBeijing("2026-09-30T01:54:58.123Z"))
    }

    @Test
    fun `formatBeijing 空值与非法值`() {
        assertEquals("-", formatBeijing(null))
        assertEquals("-", formatBeijing(""))
        assertEquals("-", formatBeijing("abc"))
    }

    @Test
    fun `maskPhone 脱敏`() {
        assertEquals("138****1234", maskPhone("13800001234"))
        assertEquals("-", maskPhone(null))
        assertEquals("-", maskPhone(""))
    }

    @Test
    fun `specText 规格描述`() {
        assertEquals("中杯·冰·标准糖", specText("medium", "ice", "standard"))
        assertEquals("大杯·热·少糖", specText("large", "hot", "less"))
    }

    @Test
    fun `specText 非饮品返回空串`() {
        assertEquals("", specText(null, null, null))
    }

    @Test
    fun `orderStatusText 状态中文`() {
        assertEquals("待支付", orderStatusText("pending_payment"))
        assertEquals("已支付", orderStatusText("paid"))
        assertEquals("制作中", orderStatusText("making"))
        assertEquals("待取餐", orderStatusText("ready"))
        assertEquals("已完成", orderStatusText("completed"))
        assertEquals("已取消", orderStatusText("cancelled"))
    }

    @Test
    fun `levelProgress 等级进度`() {
        assertEquals(0, levelProgress(0, "silver"))
        assertEquals(50, levelProgress(250, "silver"))
        assertEquals(100, levelProgress(500, "silver"))
        assertEquals(0, levelProgress(500, "gold"))
        assertEquals(50, levelProgress(1250, "gold"))
        assertEquals(100, levelProgress(2000, "black"))
    }

    @Test
    fun `couponDiscount 满减券`() {
        val coupon = Coupon(
            id = 1, templateId = 1, name = "满100减20", type = "full_reduction",
            threshold = 10000, discountAmount = 2000, discountRate = null,
            status = "unused", expiresAt = "2099-01-01T00:00:00Z", usable = true,
        )
        assertEquals(2000, couponDiscount(coupon, 10000))
        assertEquals(2000, couponDiscount(coupon, 12000))
        assertEquals(0, couponDiscount(coupon, 9999))
    }

    @Test
    fun `couponDiscount 折扣券`() {
        val coupon = Coupon(
            id = 2, templateId = 2, name = "9折券", type = "discount",
            threshold = 0, discountAmount = null, discountRate = 90,
            status = "unused", expiresAt = "2099-01-01T00:00:00Z", usable = true,
        )
        assertEquals(1000, couponDiscount(coupon, 10000))
        assertEquals(280, couponDiscount(coupon, 2800))
    }
}
