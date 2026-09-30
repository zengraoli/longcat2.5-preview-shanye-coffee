/**
 * 存储抽象：H5 用 localStorage，小程序用 uni.getStorageSync。
 * 两者 API 不同，统一封装避免在业务代码里直接调用 localStorage。
 */

export function storageGet(key: string): string | null {
  // #ifdef H5
  return localStorage.getItem(key);
  // #endif
  // #ifndef H5
  return uni.getStorageSync(key) || null;
  // #endif
}

export function storageSet(key: string, value: string): void {
  // #ifdef H5
  localStorage.setItem(key, value);
  // #endif
  // #ifndef H5
  uni.setStorageSync(key, value);
  // #endif
}

export function storageRemove(key: string): void {
  // #ifdef H5
  localStorage.removeItem(key);
  // #endif
  // #ifndef H5
  uni.removeStorageSync(key);
  // #endif
}
