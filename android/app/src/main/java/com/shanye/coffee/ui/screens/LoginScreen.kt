package com.shanye.coffee.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.SessionStore
import com.shanye.coffee.ui.theme.Brand600
import com.shanye.coffee.ui.theme.Brand900
import com.shanye.coffee.ui.theme.Cream50
import com.shanye.coffee.ui.theme.Caramel500
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    repository: Repository,
    sessionStore: SessionStore,
    onLoggedIn: () -> Unit,
) {
    var phone by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var agreed by remember { mutableStateOf(true) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream50)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(80.dp))

        // 品牌 Logo
        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(Brand600),
            contentAlignment = Alignment.Center,
        ) {
            Text("山", color = Cream50, fontSize = 36.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.height(24.dp))
        Text("山野咖啡", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = Brand900)
        Spacer(Modifier.height(8.dp))
        Text("从山野来，到你杯中", fontSize = 14.sp, color = Color(0xFF5C6B60))

        Spacer(Modifier.height(48.dp))

        // 手机号输入
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it.filter { c -> c.isDigit() }.take(11) },
            label = { Text("请输入手机号") },
            prefix = { Text("+86") },
            singleLine = true,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = KeyboardType.Phone,
            ),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )

        Spacer(Modifier.height(16.dp))

        // 验证码输入
        OutlinedTextField(
            value = code,
            onValueChange = { code = it.filter { c -> c.isDigit() }.take(6) },
            label = { Text("验证码") },
            singleLine = true,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                keyboardType = KeyboardType.Number,
            ),
            trailingIcon = {
                Text(
                    "获取验证码",
                    color = Caramel500,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(end = 8.dp),
                )
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        )

        Spacer(Modifier.height(16.dp))

        // 协议勾选
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = agreed,
                onCheckedChange = { agreed = it },
            )
            Text("我已阅读并同意《用户协议》《隐私政策》", fontSize = 13.sp, color = Color(0xFF5C6B60))
        }

        if (error.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(error, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
        }

        Spacer(Modifier.height(24.dp))

        // 登录按钮
        Button(
            onClick = {
                if (!agreed) { error = "请先同意用户协议"; return@Button }
                if (phone.length != 11) { error = "请输入 11 位手机号"; return@Button }
                if (code.length != 6) { error = "请输入 6 位验证码"; return@Button }
                error = ""
                loading = true
                scope.launch {
                    try {
                        val res = repository.login(phone, code)
                        sessionStore.save(res.token, res.member)
                        loading = false
                        onLoggedIn()
                    } catch (e: Exception) {
                        loading = false
                        error = e.message ?: "登录失败"
                    }
                }
            },
            enabled = !loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(26.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Brand600),
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = Cream50,
                    strokeWidth = 2.dp,
                )
            } else {
                Text("登录 / 注册", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(16.dp))
        Text("演示环境验证码固定为 123456", fontSize = 12.sp, color = Color(0xFF8A968D))
    }
}
