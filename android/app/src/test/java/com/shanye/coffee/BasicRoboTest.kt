package com.shanye.coffee

import androidx.compose.material3.Text
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertIsDisplayed
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

@RunWith(AndroidJUnit4::class)
@Config(sdk = [35], manifest = "AndroidManifest.xml")
class BasicRoboTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun basicTest() {
        composeRule.setContent {
            Text("Hello")
        }
        composeRule.onNodeWithText("Hello").assertIsDisplayed()
    }
}
