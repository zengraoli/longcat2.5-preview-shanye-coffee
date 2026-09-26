package com.shanyecoffee.app.core.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "shanYe_session")

/** 登录态本地存储（DataStore） */
class TokenStore(private val context: Context) {

    companion object {
        private val KEY_TOKEN = stringPreferencesKey("token")
        private val KEY_MEMBER_ID = intPreferencesKey("member_id")
        private val KEY_PHONE = stringPreferencesKey("phone")
        private val KEY_POINTS = intPreferencesKey("points")
    }

    suspend fun save(token: String, memberId: Int, phone: String, points: Int) {
        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN] = token
            prefs[KEY_MEMBER_ID] = memberId
            prefs[KEY_PHONE] = phone
            prefs[KEY_POINTS] = points
        }
    }

    suspend fun restore(): StoredSession? {
        val prefs = context.dataStore.data.first()
        val token = prefs[KEY_TOKEN] ?: return null
        return StoredSession(
            token = token,
            memberId = prefs[KEY_MEMBER_ID] ?: 0,
            phone = prefs[KEY_PHONE] ?: "",
            points = prefs[KEY_POINTS] ?: 0,
        )
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}

data class StoredSession(
    val token: String,
    val memberId: Int,
    val phone: String,
    val points: Int,
)
