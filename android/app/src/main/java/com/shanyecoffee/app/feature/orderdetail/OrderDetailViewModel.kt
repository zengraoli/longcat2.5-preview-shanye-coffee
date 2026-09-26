package com.shanyecoffee.app.feature.orderdetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shanyecoffee.app.core.api.OrderDetailDto
import com.shanyecoffee.app.core.data.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OrderDetailUiState(
    val loading: Boolean = true,
    val order: OrderDetailDto? = null,
    val error: String? = null,
)

class OrderDetailViewModel(
    private val orderId: Int,
) : ViewModel() {

    private val orderRepository = OrderRepository()

    private val _uiState = MutableStateFlow(OrderDetailUiState())
    val uiState: StateFlow<OrderDetailUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        _uiState.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val order = orderRepository.orderDetail(orderId)
                _uiState.update { it.copy(loading = false, order = order) }
            } catch (e: Exception) {
                _uiState.update { it.copy(loading = false, error = e.message ?: "加载失败，请重试") }
            }
        }
    }

    fun refresh() {
        _uiState.update { it.copy(loading = it.order == null) }
        load()
    }
}
