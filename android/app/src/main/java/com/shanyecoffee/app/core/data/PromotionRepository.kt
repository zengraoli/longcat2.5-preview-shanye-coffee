package com.shanyecoffee.app.core.data

import com.shanyecoffee.app.core.api.ActivePromotionDto
import com.shanyecoffee.app.core.api.ShanYeClient
import com.shanyecoffee.app.core.api.apiCall

/** 活动接口 */
class PromotionRepository {

    /** 当前进行中的活动；无活动返回 null */
    suspend fun activePromotion(): ActivePromotionDto? = apiCall {
        ShanYeClient.api.activePromotion()
    }
}
