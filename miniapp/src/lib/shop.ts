/**
 * 当前选中门店：首页选择后，点单与确认订单页共用。
 * 持久化到 storage，刷新后恢复。
 */
import { ref } from 'vue';
import type { Store } from './types';
import { storageGet, storageSet } from './storage';

const STORE_KEY = 'shanye_miniapp_store';

function load(): number {
  const raw = storageGet(STORE_KEY);
  if (!raw) return 0;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

/** 当前选中门店 ID，0 表示未选择 */
export const currentStoreId = ref<number>(load());

export function setCurrentStoreId(id: number) {
  currentStoreId.value = id;
  storageSet(STORE_KEY, String(id));
}

/** 从门店列表中解析当前门店；列表未加载时返回 null */
export function resolveStore(stores: Store[]): Store | null {
  if (!stores.length) return null;
  const found = stores.find((s) => s.id === currentStoreId.value);
  if (found) return found;
  const firstOpen = stores.find((s) => s.isOpen);
  return firstOpen ?? stores[0];
}
