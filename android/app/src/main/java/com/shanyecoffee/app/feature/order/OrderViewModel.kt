package com.shanyecoffee.app.feature.order

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shanyecoffee.app.core.api.CategoryDto
import com.shanyecoffee.app.core.api.ProductDetailDto
import com.shanyecoffee.app.core.api.ProductDto
import com.shanyecoffee.app.core.cart.CartManager
import com.shanyecoffee.app.core.data.ProductRepository
import com.shanyecoffee.app.core.data.PromotionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SpecSelection(
    val product: ProductDetailDto? = null,
    val cupSize: String = DEFAULT_CUP,
    val temperature: String = DEFAULT_TEMPERATURE,
    val sugar: String = DEFAULT_SUGAR,
    val quantity: Int = 1,
) {
    /** 当前规格单价（分） */
    val unitPrice: Int
        get() = product?.let { p ->
            p.price + (p.specs.firstOrNull {
                it.cupSize == cupSize && it.temperature == temperature && it.sugar == sugar
            }?.priceDelta ?: 0)
        } ?: 0

    companion object {
        const val DEFAULT_CUP = "medium"
        const val DEFAULT_TEMPERATURE = "hot"
        const val DEFAULT_SUGAR = "standard"
    }
}

data class OrderUiState(
    val loading: Boolean = true,
    val categories: List<CategoryDto> = emptyList(),
    val products: List<ProductDto> = emptyList(),
    val promoProductIds: Set<Int> = emptySet(),
    val selectedCategoryId: Int? = null,
    val spec: SpecSelection? = null,
    val specLoading: Boolean = false,
    val error: String? = null,
) {
    val visibleProducts: List<ProductDto>
        get() = selectedCategoryId?.let { id -> products.filter { it.categoryId == id } } ?: emptyList()

    fun isPromo(productId: Int): Boolean = productId in promoProductIds
}

class OrderViewModel : ViewModel() {

    private val productRepository = ProductRepository()
    private val promotionRepository = PromotionRepository()

    private val _uiState = MutableStateFlow(OrderUiState())
    val uiState: StateFlow<OrderUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        _uiState.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val categories = productRepository.categories()
                val products = productRepository.products()
                val promotion = promotionRepository.activePromotion()
                _uiState.update {
                    it.copy(
                        loading = false,
                        categories = categories,
                        products = products,
                        promoProductIds = promotion?.productIds?.toSet() ?: emptySet(),
                        selectedCategoryId = it.selectedCategoryId ?: categories.firstOrNull()?.id,
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(loading = false, error = e.message ?: "加载失败，请重试") }
            }
        }
    }

    fun selectCategory(categoryId: Int) {
        _uiState.update { it.copy(selectedCategoryId = categoryId) }
    }

    fun setOrderType(type: String) {
        CartManager.setOrderType(type)
    }

    fun openSpec(product: ProductDto) {
        _uiState.update { it.copy(specLoading = true) }
        viewModelScope.launch {
            try {
                val detail = productRepository.productDetail(product.id)
                val current = _uiState.value.spec
                _uiState.update {
                    it.copy(
                        specLoading = false,
                        spec = SpecSelection(
                            product = detail,
                            cupSize = if (current?.product?.id == detail.id) current.cupSize else pickDefault(detail, { s -> s.cupSize }, SpecSelection.DEFAULT_CUP),
                            temperature = if (current?.product?.id == detail.id) current.temperature else pickDefault(detail, { s -> s.temperature }, SpecSelection.DEFAULT_TEMPERATURE),
                            sugar = if (current?.product?.id == detail.id) current.sugar else pickDefault(detail, { s -> s.sugar }, SpecSelection.DEFAULT_SUGAR),
                            quantity = 1,
                        ),
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(specLoading = false, error = e.message ?: "商品信息加载失败") }
            }
        }
    }

    fun updateSpec(
        cupSize: String? = null,
        temperature: String? = null,
        sugar: String? = null,
    ) {
        _uiState.update { state ->
            val spec = state.spec ?: return@update state
            val newCup = cupSize ?: spec.cupSize
            val newTemp = temperature ?: spec.temperature
            val newSugar = sugar ?: spec.sugar
            // 当前组合不存在时，回退到该杯型/温度下可用的第一个糖度
            val exists = spec.product?.specs?.any {
                it.cupSize == newCup && it.temperature == newTemp && it.sugar == newSugar
            } == true
            if (exists) {
                state.copy(spec = spec.copy(cupSize = newCup, temperature = newTemp, sugar = newSugar))
            } else {
                val fallbackSugar = spec.product?.specs
                    ?.firstOrNull { it.cupSize == newCup && it.temperature == newTemp }
                    ?.sugar ?: newSugar
                state.copy(
                    spec = spec.copy(
                        cupSize = newCup,
                        temperature = newTemp,
                        sugar = fallbackSugar,
                    ),
                )
            }
        }
    }

    fun setQuantity(quantity: Int) {
        _uiState.update { state ->
            val spec = state.spec ?: return@update state
            state.copy(spec = spec.copy(quantity = quantity.coerceIn(1, 99)))
        }
    }

    fun closeSpec() {
        _uiState.update { it.copy(spec = null) }
    }

    fun addToCart(onAdded: () -> Unit = {}) {
        val spec = _uiState.value.spec ?: return
        val product = spec.product ?: return
        CartManager.add(
            CartManager.Line(
                productId = product.id,
                categoryId = product.categoryId,
                name = product.name,
                cupSize = spec.cupSize,
                temperature = spec.temperature,
                sugar = spec.sugar,
                quantity = spec.quantity,
                unitPrice = spec.unitPrice,
            ),
        )
        closeSpec()
        onAdded()
    }

    private fun pickDefault(
        detail: ProductDetailDto,
        selector: (com.shanyecoffee.app.core.api.ProductSpecDto) -> String,
        preferred: String,
    ): String {
        val specs = detail.specs
        return specs.firstOrNull { selector(it) == preferred }?.let(selector)
            ?: specs.firstOrNull()?.let(selector)
            ?: ""
    }
}
