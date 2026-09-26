package com.shanyecoffee.app.feature.checkout

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shanyecoffee.app.core.api.BestCouponDto
import com.shanyecoffee.app.core.api.StoreDto
import com.shanyecoffee.app.core.cart.CartManager
import com.shanyecoffee.app.core.data.CouponRepository
import com.shanyecoffee.app.core.data.OrderRepository
import com.shanyecoffee.app.core.data.PromotionRepository
import com.shanyecoffee.app.core.data.ServiceLocator
import com.shanyecoffee.app.core.data.StorePreferences
import com.shanyecoffee.app.core.data.StoreRepository
import com.shanyecoffee.app.core.util.CouponDiscount
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CheckoutUiState(
    val loading: Boolean = true,
    val stores: List<StoreDto> = emptyList(),
    val selectedStoreId: Int? = null,
    val promoProductIds: Set<Int> = emptySet(),
    val bestCoupon: BestCouponDto? = null,
    val couponLoading: Boolean = false,
    val submitting: Boolean = false,
    val error: String? = null,
) {
    val selectedStore: StoreDto?
        get() = stores.firstOrNull { it.id == selectedStoreId }

    val originalTotal: Int
        get() = CartManager.originalTotal

    /** 第二杯半价优惠（分） */
    val promoDiscount: Int
        get() = CartManager.promoDiscount(promoProductIds)

    val amountAfterPromo: Int
        get() = originalTotal - promoDiscount

    /** 优惠券优惠（分），与 server 一致：券门槛按活动后金额计算 */
    val couponDiscount: Int
        get() {
            val coupon = bestCoupon ?: return 0
            return CouponDiscount.calculate(coupon.type, coupon.threshold, coupon.discount, amountAfterPromo)
        }

    val totalDiscount: Int
        get() = promoDiscount + couponDiscount

    /** 实付（分）；下单后以 server 返回为准 */
    val paidAmount: Int
        get() = amountAfterPromo - couponDiscount
}

class CheckoutViewModel : ViewModel() {

    private val orderRepository = OrderRepository()
    private val couponRepository = CouponRepository()
    private val promotionRepository = PromotionRepository()
    private val storeRepository = StoreRepository()
    private val storePreferences: StorePreferences = ServiceLocator.storePreferences

    private val _uiState = MutableStateFlow(CheckoutUiState())
    val uiState: StateFlow<CheckoutUiState> = _uiState.asStateFlow()

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
                        promoProductIds = promotion?.productIds?.toSet() ?: emptySet(),
                    )
                }
                loadBestCoupon()
            } catch (e: Exception) {
                _uiState.update { it.copy(loading = false, error = e.message ?: "加载失败，请重试") }
            }
        }
    }

    /** 默认选择最优优惠券（金额为活动后金额） */
    fun loadBestCoupon() {
        val state = _uiState.value
        if (state.originalTotal <= 0) return
        _uiState.update { it.copy(couponLoading = true) }
        viewModelScope.launch {
            try {
                val best = couponRepository.bestCoupon(state.amountAfterPromo)
                _uiState.update { it.copy(bestCoupon = best, couponLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(couponLoading = false) }
            }
        }
    }

    /** 模拟支付：先创建订单，再以 server 返回金额为准支付 */
    fun submitOrder(onSuccess: (orderId: Int) -> Unit) {
        val state = _uiState.value
        if (state.submitting) return
        val storeId = state.selectedStoreId
        if (storeId == null) {
            _uiState.update { it.copy(error = "请先选择门店") }
            return
        }
        if (CartManager.itemCount == 0) {
            _uiState.update { it.copy(error = "购物车是空的") }
            return
        }
        _uiState.update { it.copy(submitting = true, error = null) }
        viewModelScope.launch {
            try {
                val cartLines = CartManager.lines.value.map {
                    com.shanyecoffee.app.core.data.CartLine(
                        productId = it.productId,
                        quantity = it.quantity,
                        unitPrice = it.unitPrice,
                        cupSize = it.cupSize,
                        temperature = it.temperature,
                        sugar = it.sugar,
                    )
                }
                val order = orderRepository.createOrder(
                    storeId = storeId,
                    type = CartManager.orderType.value,
                    items = cartLines,
                    userCouponId = state.bestCoupon?.userCouponId,
                )
                val paid = orderRepository.payOrder(order.id)
                CartManager.clear()
                _uiState.update { it.copy(submitting = false) }
                onSuccess(paid.id)
            } catch (e: Exception) {
                _uiState.update { it.copy(submitting = false, error = e.message ?: "提交订单失败，请重试") }
            }
        }
    }
}
