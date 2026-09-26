package com.shanyecoffee.app.core.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.storeDataStore: DataStore<Preferences> by preferencesDataStore(name = "shanYe_store")

/** 选择门店等偏好 */
class StorePreferences(private val context: Context) {

    companion object {
        private val KEY_SELECTED_STORE = intPreferencesKey("selected_store_id")
    }

    suspend fun saveSelectedStore(storeId: Int) {
        context.storeDataStore.edit { it[KEY_SELECTED_STORE] = storeId }
    }

    suspend fun selectedStoreId(): Int? =
        context.storeDataStore.data.first()[KEY_SELECTED_STORE]
}
