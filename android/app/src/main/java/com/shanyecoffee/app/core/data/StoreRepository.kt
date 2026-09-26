package com.shanyecoffee.app.core.data

import com.shanyecoffee.app.core.api.ShanYeClient
import com.shanyecoffee.app.core.api.StoreDto
import com.shanyecoffee.app.core.api.apiCall

/** 门店接口 */
class StoreRepository {

    suspend fun stores(): List<StoreDto> = apiCall {
        ShanYeClient.api.stores()
    }
}
