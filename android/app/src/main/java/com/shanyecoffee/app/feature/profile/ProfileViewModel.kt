package com.shanyecoffee.app.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shanyecoffee.app.core.data.CouponRepository
import com.shanyecoffee.app.core.data.MemberRepository
import com.shanyecoffee.app.core.data.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val loading: Boolean = true,
    val phone: String = "",
    val points: Int = 0,
    val couponCount: Int = 0,
    val orderCount: Int = 0,
    val error: String? = null,
)

class ProfileViewModel : ViewModel() {

    private val memberRepository = MemberRepository()
    private val couponRepository = CouponRepository()
    private val orderRepository = OrderRepository()

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        _uiState.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val member = memberRepository.me()
                val coupons = couponRepository.myCoupons()
                val orders = orderRepository.orders()
                _uiState.update {
                    it.copy(
                        loading = false,
                        phone = member.phone,
                        points = member.points,
                        couponCount = coupons.count { coupon -> coupon.status == "unused" },
                        orderCount = orders.size,
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(loading = false, error = e.message ?: "加载失败，请重试") }
            }
        }
    }
}
