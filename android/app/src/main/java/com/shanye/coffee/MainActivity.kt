package com.shanye.coffee

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.SessionStore
import com.shanye.coffee.navigation.Routes
import com.shanye.coffee.navigation.ShanyeNavGraph
import com.shanye.coffee.ui.theme.ShanyeCoffeeTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionStore = SessionStore(applicationContext)
        val repository = Repository(sessionStore)

        // deep link: shanye://<page>
        val deepLinkRoute = intent?.data?.host?.let { host ->
            when (host.lowercase()) {
                "login" -> Routes.LOGIN
                "home" -> Routes.HOME
                "order" -> Routes.ORDER
                "checkout" -> Routes.CHECKOUT
                "orders" -> Routes.ORDERS
                "profile" -> Routes.PROFILE
                else -> null
            }
        }

        setContent {
            ShanyeCoffeeTheme {
                val startDestination = remember {
                    runBlocking {
                        if (sessionStore.isLoggedIn()) deepLinkRoute ?: Routes.HOME
                        else Routes.LOGIN
                    }
                }
                MainScreen(
                    repository = repository,
                    sessionStore = sessionStore,
                    startDestination = startDestination,
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // 处理运行时的 deep link（单 Activity）
        setIntent(intent)
    }
}

private data class TabItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

private val tabs = listOf(
    TabItem(Routes.HOME, "首页", Icons.Filled.Home),
    TabItem(Routes.ORDER, "点单", Icons.Filled.ShoppingCart),
    TabItem(Routes.ORDERS, "订单", Icons.Filled.List),
    TabItem(Routes.PROFILE, "我的", Icons.Filled.AccountCircle),
)

@Composable
private fun MainScreen(
    repository: Repository,
    sessionStore: SessionStore,
    startDestination: String,
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // 未登录时跳转登录页
    var isLoggedIn by remember { mutableStateOf(true) }
    LaunchedEffect(Unit) {
        isLoggedIn = sessionStore.isLoggedIn()
    }
    LaunchedEffect(currentRoute) {
        if (!isLoggedIn && currentRoute != Routes.LOGIN) {
            navController.navigate(Routes.LOGIN) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    Scaffold(
        bottomBar = {
            if (isLoggedIn && currentRoute != Routes.LOGIN) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        ShanyeNavGraph(
            navController = navController,
            repository = repository,
            sessionStore = sessionStore,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding),
        )
    }
}
