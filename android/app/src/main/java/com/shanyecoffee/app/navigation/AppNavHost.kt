package com.shanyecoffee.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.shanyecoffee.app.feature.checkout.CheckoutScreen
import com.shanyecoffee.app.feature.home.HomeScreen
import com.shanyecoffee.app.feature.login.LoginScreen
import com.shanyecoffee.app.feature.order.OrderScreen
import com.shanyecoffee.app.feature.orderdetail.OrderDetailScreen
import com.shanyecoffee.app.feature.orders.OrdersScreen
import com.shanyecoffee.app.feature.profile.ProfileScreen

@Composable
fun AppNavHost(navController: NavHostController) {
    MainScaffold(navController = navController) {
        NavHostContent(navController)
    }
}

@Composable
private fun NavHostContent(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Routes.HOME) {
        composable(
            route = Routes.LOGIN,
            deepLinks = listOf(navDeepLink { uriPattern = "shanye://login" }),
        ) {
            LoginScreen(
                onLoginSuccess = {
                    // 登录后回到原页面；无来源页（如 deep link 直接进入）时回首页
                    if (!navController.popBackStack()) {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    }
                },
            )
        }

        composable(
            route = Routes.HOME,
            deepLinks = listOf(navDeepLink { uriPattern = "shanye://home" }),
        ) {
            HomeScreen(
                onGoToOrder = { orderType ->
                    navController.navigate(Routes.ORDER)
                },
                onNeedLogin = { navController.navigate(Routes.LOGIN) },
            )
        }

        composable(
            route = Routes.ORDER,
            deepLinks = listOf(navDeepLink { uriPattern = "shanye://order" }),
        ) {
            OrderScreen(
                onNeedLogin = { navController.navigate(Routes.LOGIN) },
                onGoToCheckout = { navController.navigate(Routes.CHECKOUT) },
            )
        }

        composable(
            route = Routes.CHECKOUT,
            deepLinks = listOf(navDeepLink { uriPattern = "shanye://checkout" }),
        ) {
            CheckoutScreen(
                onNeedLogin = { navController.navigate(Routes.LOGIN) },
                onPaySuccess = { orderId ->
                    navController.navigate(Routes.orderDetail(orderId)) {
                        popUpTo(Routes.CHECKOUT) { inclusive = true }
                    }
                },
            )
        }

        composable(
            route = Routes.ORDERS,
            deepLinks = listOf(navDeepLink { uriPattern = "shanye://orders" }),
        ) {
            OrdersScreen(
                onGoToDetail = { orderId -> navController.navigate(Routes.orderDetail(orderId)) },
                onNeedLogin = { navController.navigate(Routes.LOGIN) },
            )
        }

        composable(
            route = Routes.ORDER_DETAIL,
            arguments = listOf(navArgument(Routes.ARG_ORDER_ID) { type = NavType.IntType }),
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getInt(Routes.ARG_ORDER_ID) ?: 0
            OrderDetailScreen(
                orderId = orderId,
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.PROFILE,
            deepLinks = listOf(navDeepLink { uriPattern = "shanye://profile" }),
        ) {
            ProfileScreen(
                onNeedLogin = { navController.navigate(Routes.LOGIN) },
                onGoToOrders = { navController.navigate(Routes.ORDERS) },
            )
        }
    }
}
