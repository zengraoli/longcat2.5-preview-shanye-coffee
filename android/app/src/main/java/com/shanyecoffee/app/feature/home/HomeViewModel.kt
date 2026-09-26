package com.shanyecoffee.app.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shanyecoffee.app.core.api.ActivePromotionDto
import com.shanyecoffee.app.core.api.ProductDetailDto
import com.shanyecoffee.app.core.api.ProductDto
import com.shanyecoffee.app.core.api.StoreDto
import com.shanyecoffee.app.core.cart.CartManager
import com.shanyecoffee.app.core.data.ProductRepository
import com.shanyecoffee.app.core.data.PromotionRepository
import com.shanyecoffee.app.core.data.ServiceLocator
import com.shanyecoffee.app.core.data.StorePreferences
import com.shanyecoffee.app.core.data.StoreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val loading: Boolean = true,
    val stores: List<StoreDto> = emptyList(),
    val selectedStoreId: Int? = null,
    val promotion: ActivePromotionDto? = null,
    val quickAddingProductId: Int? = null,
    val error: String? = null,
) {
    val selectedStore: StoreDto?
        get() = stores.firstOrNull { it.id == selectedStoreId }

    /** 当季推荐：活动商品（最多 2 个） */
    val recommended: List<ProductDto>
        get() = promotion?.products?.filter { !it.soldOut }?.take(2) ?: emptyList()
}

class HomeViewModel : ViewModel() {

    private val storeRepository = StoreRepository()
    private val productRepository = ProductRepository()
    private val promotionRepository = PromotionRepository()
    private val storePreferences: StorePreferences = ServiceLocator.storePreferences

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        _uiState.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val stores = storeRepository.stores()
                val selectedId = storePreferences.selectedStoreId() ?: stores.firstOrNull()?.id
                val promotion = promotionRepository.activePromotion()
                _uiState.update {
                    it.copy(
                        loading = false,
                        stores = stores,
                        selectedStoreId = selectedId,
                        promotion = promotion,
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(loading = false, error = e.message ?: "加载失败，请重试") }
            }
        }
    }

    fun selectStore(storeId: Int) {
        _uiState.update { it.copy(selectedStoreId = storeId) }
        viewModelScope.launch { storePreferences.saveSelectedStore(storeId) }
    }

    /** 当季推荐“+”：默认规格（中杯 · 热 · 标准）快速加入购物车 */
    fun quickAdd(product: ProductDto, onDone: () -> Unit = {}) {
        if (_uiState.value.quickAddingProductId != null) return
        _uiState.update { it.copy(quickAddingProductId = product.id) }
        viewModelScope.launch {
            try {
                val detail: ProductDetailDto = productRepository.productDetail(product.id)
                CartManager.add(
                    CartManager.Line(
                        productId = detail.id,
                        name = detail.name,
                        cupSize = DEFAULT_CUP,
                        temperature = DEFAULT_TEMPERATURE,
                        sugar = DEFAULT_SUGAR,
                        quantity = 1,
                        unitPrice = detail.price + (detail.specs.firstOrNull {
                            it.cupSize == DEFAULT_CUP &&
                                it.temperature == DEFAULT_TEMPERATURE &&
                                it.sugar == DEFAULT_SUGAR
                        }?.priceDelta ?: 0),
                    ),
                )
            } catch (_: Exception) {
                // 快速加购失败静默处理，用户仍可通过规格弹窗加购
            } finally {
                _uiState.update { it.copy(quickAddingProductId = null) }
                onDone()
            }
        }
    }

    private companion object {
        const val DEFAULT_CUP = "medium"
        const val DEFAULT_TEMPERATURE = "hot"
        const val DEFAULT_SUGAR = "standard"
    }
}
