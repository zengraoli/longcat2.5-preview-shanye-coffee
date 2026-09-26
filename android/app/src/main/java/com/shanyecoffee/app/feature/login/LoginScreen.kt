package com.shanyecoffee.app.feature.login

import android.widget.Toast
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shanyecoffee.app.core.ui.components.BrandLogo
import com.shanyecoffee.app.core.ui.theme.BrandGreen
import com.shanyecoffee.app.core.ui.theme.Cream
import com.shanyecoffee.app.core.ui.theme.Radii
import com.shanyecoffee.app.core.ui.theme.TagOrangeBg
import com.shanyecoffee.app.core.ui.theme.Terracotta
import com.shanyecoffee.app.core.ui.theme.TextPrimary
import com.shanyecoffee.app.core.ui.theme.TextSecondary

/**
 * 登录页（设计稿 AD1）
 * 手机号 + 验证码登录，演示环境验证码固定 123456；登录成功后回到原页面。
 */
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Cream)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(96.dp))

        BrandLogo(size = 96)

        Spacer(modifier = Modifier.height(28.dp))

        Text(
            text = "山野咖啡",
            color = BrandGreen,
            fontSize = 38.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 4.sp,
        )

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            text = "从山野来，到你杯中",
            color = TextSecondary,
            fontSize = 16.sp,
        )

        Spacer(modifier = Modifier.height(52.dp))

        // 手机号输入框
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .background(Color.White, RoundedCornerShape(Radii.card))
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = "+86", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Medium)
            HorizontalDivider(
                modifier = Modifier
                    .padding(horizontal = 12.dp)
                    .width(1.dp)
                    .height(20.dp),
                color = Color(0xFFEDE6D8),
            )
            TextField(
                value = state.phone,
                onValueChange = viewModel::onPhoneChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("phone_input"),
                placeholder = { Text("请输入手机号", color = TextSecondary, fontSize = 16.sp) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                ),
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 验证码输入框
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .background(Color.White, RoundedCornerShape(Radii.card))
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextField(
                value = state.code,
                onValueChange = viewModel::onCodeChange,
                modifier = Modifier
                    .weight(1f)
                    .testTag("code_input"),
                placeholder = { Text("验证码", color = TextSecondary, fontSize = 16.sp) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                ),
            )
            Button(
                onClick = {
                    Toast.makeText(context, "演示环境验证码为 123456", Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier.testTag("btn_send_code"),
                shape = RoundedCornerShape(Radii.thumb),
                colors = ButtonDefaults.buttonColors(
                    containerColor = TagOrangeBg,
                    contentColor = Terracotta,
                ),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp),
            ) {
                Text(text = "获取验证码", fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // 协议勾选
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Checkbox(
                checked = state.agreed,
                onCheckedChange = viewModel::onAgreedChange,
                modifier = Modifier.testTag("check_agreement"),
                colors = CheckboxDefaults.colors(
                    checkedColor = BrandGreen,
                    checkmarkColor = Color.White,
                ),
            )
            Text(
                text = buildAnnotatedString {
                    append("我已阅读并同意")
                    withStyle(SpanStyle(color = Terracotta)) { append("《用户协议》") }
                    withStyle(SpanStyle(color = Terracotta)) { append("《隐私政策》") }
                },
                color = TextSecondary,
                fontSize = 13.sp,
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 登录按钮
        Button(
            onClick = { viewModel.login(onLoginSuccess) },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .testTag("btn_login"),
            shape = RoundedCornerShape(Radii.pill),
            enabled = !state.loading,
            colors = ButtonDefaults.buttonColors(
                containerColor = BrandGreen,
                contentColor = Color.White,
            ),
        ) {
            if (state.loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(22.dp),
                    color = Color.White,
                    strokeWidth = 2.dp,
                )
            } else {
                Text(
                    text = "登录 / 注册",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 2.sp,
                )
            }
        }

        if (state.error != null) {
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = state.error ?: "",
                color = Terracotta,
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.testTag("login_error"),
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "演示环境验证码固定为 123456",
            color = TextSecondary,
            fontSize = 13.sp,
        )
    }
}
