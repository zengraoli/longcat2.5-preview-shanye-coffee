/**
 * 购物车状态：点单页与确认订单页共享。
 * 单价含规格加价（分），金额一律整数分。
 */
import { computed, reactive } from 'vue';

export interface CartItem {
  productId: number;
  name: string;
  image: string | null;
  cup: string | null;
  temperature: string | null;
  sugar: string | null;
  /** 单价（含规格加价，分） */
  price: number;
  quantity: number;
}

const state = reactive<{ items: CartItem[] }>({ items: [] });

/** 同商品同规格合并为一行 */
function sameItem(a: CartItem, b: CartItem): boolean {
  return (
    a.productId === b.productId &&
    a.cup === b.cup &&
    a.temperature === b.temperature &&
    a.sugar === b.sugar
  );
}

export function useCart() {
  const totalQuantity = computed(() => state.items.reduce((s, i) => s + i.quantity, 0));
  const totalAmount = computed(() => state.items.reduce((s, i) => s + i.price * i.quantity, 0));

  function addItem(item: CartItem) {
    const existing = state.items.find((i) => sameItem(i, item));
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      state.items.push({ ...item });
    }
  }

  /** 返回是否已存在（用于判断是否合并） */
  function hasItem(item: CartItem): boolean {
    return state.items.some((i) => sameItem(i, item));
  }

  function setQuantity(item: CartItem, quantity: number) {
    const target = state.items.find((i) => sameItem(i, item));
    if (!target) return;
    if (quantity <= 0) {
      state.items = state.items.filter((i) => i !== target);
    } else {
      target.quantity = quantity;
    }
  }

  function clear() {
    state.items = [];
  }

  return {
    items: state.items,
    totalQuantity,
    totalAmount,
    addItem,
    hasItem,
    setQuantity,
    clear,
  };
}
