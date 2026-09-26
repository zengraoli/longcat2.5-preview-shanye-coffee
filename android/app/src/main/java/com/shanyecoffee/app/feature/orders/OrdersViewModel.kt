package com.shanyecoffee.app.feature.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shanyecoffee.app.core.api.OrderListDto
import com.shanyecoffee.app.core.data.OrderRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OrdersUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val orders: List<OrderListDto> = emptyList(),
    val error: String? = null,
)

class OrdersViewModel : ViewModel() {

    private val orderRepository = OrderRepository()

    private val _uiState = MutableStateFlow(OrdersUiState())
    val uiState: StateFlow<OrdersUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        if (_uiState.value.refreshing) return
        _uiState.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val orders = orderRepository.orders()
                _uiState.update { it.copy(loading = false, orders = orders) }
            } catch (e: Exception) {
                _uiState.update { it.copy(loading = false, error = e.message ?: "加载失败，请重试") }
            }
        }
    }

    /** 下拉刷新：后台推进状态后可见最新状态 */
    fun refresh() {
        _uiState.update { it.copy(refreshing = true) }
        viewModelScope.launch {
            try {
                val orders = orderRepository.orders()
                _uiState.update { it.copy(refreshing = false, orders = orders, error = null) }
            } catch (e: Exception) {
                _uiState.update { it.copy(refreshing = false, error = e.message ?: "刷新失败，请重试") }
            }
        }
    }
}
