package com.shanyecoffee.app.core.data

import com.shanyecoffee.app.core.api.CategoryDto
import com.shanyecoffee.app.core.api.ProductDetailDto
import com.shanyecoffee.app.core.api.ProductDto
import com.shanyecoffee.app.core.api.ShanYeClient
import com.shanyecoffee.app.core.api.apiCall

/** 商品与分类接口 */
class ProductRepository {

    suspend fun categories(): List<CategoryDto> = apiCall {
        ShanYeClient.api.categories()
    }

    suspend fun products(categoryId: Int? = null): List<ProductDto> = apiCall {
        ShanYeClient.api.products(categoryId)
    }

    suspend fun productDetail(productId: Int): ProductDetailDto = apiCall {
        ShanYeClient.api.productDetail(productId)
    }
}
