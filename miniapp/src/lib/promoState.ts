/**
 * 活动适用商品状态：首页与点单页共享，避免重复请求。
 * 进入页面时调用 refreshPromoProducts() 拉取当前生效的活动。
 */
import { ref } from 'vue';
import { api } from './api';

const applicableProductIds = ref<Set<number>>(new Set());
const loaded = ref(false);

export function usePromoProducts() {
  async function refreshPromoProducts() {
    try {
      const data = await api.get<{ applicableProductIds: number[] }>('/api/promotions');
      applicableProductIds.value = new Set(data.applicableProductIds);
    } catch {
      applicableProductIds.value = new Set();
    } finally {
      loaded.value = true;
    }
  }

  function isPromoProduct(productId: number): boolean {
    return applicableProductIds.value.has(productId);
  }

  return { applicableProductIds, loaded, refreshPromoProducts, isPromoProduct };
}
