package com.shanyecoffee.app.feature.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shanyecoffee.app.core.data.MemberRepository
import com.shanyecoffee.app.core.data.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val phone: String = "",
    val code: String = "",
    val agreed: Boolean = true,
    val loading: Boolean = false,
    val error: String? = null,
)

class LoginViewModel : ViewModel() {

    private val repository = MemberRepository()

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onPhoneChange(value: String) {
        _uiState.update { it.copy(phone = value.filter(Char::isDigit).take(11), error = null) }
    }

    fun onCodeChange(value: String) {
        _uiState.update { it.copy(code = value.filter(Char::isDigit).take(6), error = null) }
    }

    fun onAgreedChange(value: Boolean) {
        _uiState.update { it.copy(agreed = value) }
    }

    fun login(onSuccess: () -> Unit) {
        val state = _uiState.value
        if (state.loading) return
        if (!PHONE_REGEX.matches(state.phone)) {
            _uiState.update { it.copy(error = "手机号格式不正确") }
            return
        }
        if (state.code.isBlank()) {
            _uiState.update { it.copy(error = "验证码不能为空") }
            return
        }
        if (!state.agreed) {
            _uiState.update { it.copy(error = "请先阅读并同意用户协议与隐私政策") }
            return
        }
        _uiState.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            try {
                val response = repository.login(state.phone, state.code)
                SessionManager.saveLogin(response.token, response.member)
                _uiState.update { it.copy(loading = false) }
                onSuccess()
            } catch (e: Exception) {
                _uiState.update { it.copy(loading = false, error = e.message ?: "登录失败") }
            }
        }
    }

    private companion object {
        val PHONE_REGEX = Regex("^1\\d{10}$")
    }
}
