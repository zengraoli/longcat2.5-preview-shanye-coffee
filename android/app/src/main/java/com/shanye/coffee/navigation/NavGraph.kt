package com.shanye.coffee.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.shanye.coffee.data.Repository
import com.shanye.coffee.data.SessionStore
import com.shanye.coffee.ui.screens.CheckoutScreen
import com.shanye.coffee.ui.screens.HomeScreen
import com.shanye.coffee.ui.screens.LoginScreen
import com.shanye.coffee.ui.screens.OrderDetailScreen
import com.shanye.coffee.ui.screens.OrderScreen
import com.shanye.coffee.ui.screens.OrdersScreen
import com.shanye.coffee.ui.screens.ProfileScreen

/** 路由定义。deep link shanye://<page> 映射到对应路由。 */
object Routes {
    const val LOGIN = "login"
    const val HOME = "home"
    const val ORDER = "order"
    const val CHECKOUT = "checkout"
    const val ORDER_DETAIL = "orderDetail/{id}"
    const val ORDERS = "orders"
    const val PROFILE = "profile"

    fun orderDetail(id: Int) = "orderDetail/$id"
}

@Composable
fun ShanyeNavGraph(
    navController: NavHostController,
    repository: Repository,
    sessionStore: SessionStore,
    startDestination: String,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier,
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                repository = repository,
                sessionStore = sessionStore,
                onLoggedIn = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.HOME) {
            HomeScreen(
                repository = repository,
                onGoToOrder = { navController.navigate(Routes.ORDER) },
                onGoToMenu = { navController.navigate(Routes.ORDER) },
            )
        }
        composable(Routes.ORDER) {
            OrderScreen(
                repository = repository,
                onGoToCheckout = { navController.navigate(Routes.CHECKOUT) },
            )
        }
        composable(Routes.CHECKOUT) {
            CheckoutScreen(
                repository = repository,
                onPaid = { orderId ->
                    navController.navigate(Routes.orderDetail(orderId)) {
                        popUpTo(Routes.HOME)
                    }
                },
            )
        }
        composable(
            Routes.ORDER_DETAIL,
            arguments = listOf(navArgument("id") { type = NavType.IntType }),
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getInt("id") ?: 0
            OrderDetailScreen(
                repository = repository,
                orderId = id,
                onBack = { navController.popBackStack() },
            )
        }
        composable(Routes.ORDERS) {
            OrdersScreen(
                repository = repository,
                onGoToDetail = { id -> navController.navigate(Routes.orderDetail(id)) },
                onGoToOrder = { navController.navigate(Routes.ORDER) },
            )
        }
        composable(Routes.PROFILE) {
            ProfileScreen(
                repository = repository,
                sessionStore = sessionStore,
                onGoToOrders = { navController.navigate(Routes.ORDERS) },
                onGoToOrder = { navController.navigate(Routes.ORDER) },
                onLoggedOut = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }
    }
}
