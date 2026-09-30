package com.shanye.coffee.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "shanye_session")

/** 登录态：DataStore 保存 token 与会员信息。 */
class SessionStore(private val context: Context) {

    private val tokenKey = stringPreferencesKey("token")
    private val memberKey = stringPreferencesKey("member_json")

    suspend fun save(token: String, member: Member) {
        context.dataStore.edit { prefs ->
            prefs[tokenKey] = token
            prefs[memberKey] = Json.encodeToString(Member.serializer(), member)
        }
    }

    suspend fun getToken(): String? =
        context.dataStore.data.first()[tokenKey]

    suspend fun getMember(): Member? {
        val json = context.dataStore.data.first()[memberKey] ?: return null
        return runCatching {
            Json.decodeFromString(Member.serializer(), json)
        }.getOrNull()
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    suspend fun isLoggedIn(): Boolean = getToken() != null
}
