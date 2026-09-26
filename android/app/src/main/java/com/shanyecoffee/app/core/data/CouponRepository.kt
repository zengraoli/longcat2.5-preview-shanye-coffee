package com.shanyecoffee.app.core.data

import com.shanyecoffee.app.core.api.BestCouponDto
import com.shanyecoffee.app.core.api.BestCouponRequest
import com.shanyecoffee.app.core.api.ShanYeClient
import com.shanyecoffee.app.core.api.UserCouponDto
import com.shanyecoffee.app.core.api.apiCall
import retrofit2.http.Path

/** 优惠券接口 */
class CouponRepository {

    suspend fun myCoupons(): List<UserCouponDto> = apiCall {
        ShanYeClient.api.myCoupons()
    }

    /** 默认选择最优优惠券；无可用券返回 null */
    suspend fun bestCoupon(amount: Int): BestCouponDto? = apiCall {
        ShanYeClient.api.bestCoupon(BestCouponRequest(amount = amount))
    }

    /** 领取优惠券 */
    suspend fun claimCoupon(couponId: Int) {
        apiCall { ShanYeClient.api.claimCoupon(couponId) }
    }
}
