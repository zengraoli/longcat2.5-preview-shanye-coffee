<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { api } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { currentStoreId, resolveStore } from '../../lib/shop';
import { formatYuan, specPriceAdjust, specText, unitPrice } from '../../lib/utils';
import type { Category, Product, ProductSpec, Store } from '../../lib/types';
import ProductArt from '../../components/ProductArt.vue';

const { items: cartItems, totalQuantity, totalAmount, addItem, setQuantity, clear: clearCart } =
  useCart();

const categories = ref<Category[]>([]);
const products = ref<Product[]>([]);
const stores = ref<Store[]>([]);
const loading = ref(true);

const activeCategoryId = ref(0);
/** 右侧列表滚动目标（scroll-into-view） */
const scrollTo = ref('');
/** 各分类区块的顶部偏移（滚动联动用） */
const sectionTops = ref<Record<number, number>>({});

onMounted(async () => {
  try {
    const [categoryList, productList, storeList] = await Promise.all([
      api.get<Category[]>('/api/categories'),
      api.get<Product[]>('/api/products'),
      api.get<Store[]>('/api/stores'),
    ]);
    categories.value = categoryList;
    products.value = productList;
    stores.value = storeList;
    activeCategoryId.value = categoryList[0]?.id ?? 0;
    await nextTick();
    measureSections();
  } finally {
    loading.value = false;
  }
});

const currentStore = computed<Store | null>(() => resolveStore(stores.value));

/** 按分类分组的商品（保持分类顺序） */
const grouped = computed(() => {
  return categories.value
    .map((c) => ({
      category: c,
      items: products.value.filter((p) => p.categoryId === c.id),
    }))
    .filter((g) => g.items.length > 0);
});

function measureSections() {
  const query = uni.createSelectorQuery();
  query.select('.product-list').boundingClientRect();
  grouped.value.forEach((g) => {
    query.select(`.section-${g.category.id}`).boundingClientRect();
  });
  query.exec((res) => {
    const tops: Record<number, number> = {};
    const listRect = res[0] as { top: number } | null;
    grouped.value.forEach((g, i) => {
      const rect = res[i + 1] as { top: number } | null;
      if (rect && listRect) {
        tops[g.category.id] = rect.top - listRect.top;
      }
    });
    sectionTops.value = tops;
  });
}

/** 左侧分类点击：右侧滚动到对应区块 */
function onCategoryTap(id: number) {
  activeCategoryId.value = id;
  scrollTo.value = '';
  nextTick(() => {
    scrollTo.value = `section-${id}`;
  });
}

/** 右侧滚动：高亮当前分类 */
function onScroll(e: { detail: { scrollTop: number } }) {
  const scrollTop = e.detail.scrollTop;
  let current = activeCategoryId.value;
  for (const g of grouped.value) {
    const top = sectionTops.value[g.category.id];
    if (top !== undefined && scrollTop >= top - 8) {
      current = g.category.id;
    }
  }
  if (current !== activeCategoryId.value) {
    activeCategoryId.value = current;
  }
}

/* ---------- 规格弹窗 ---------- */
interface SpecSelection {
  cup: ProductSpec['cup'];
  temperature: ProductSpec['temperature'];
  sugar: ProductSpec['sugar'];
}

const specPopupVisible = ref(false);
const specProduct = ref<Product | null>(null);
const specSelection = ref<SpecSelection>({ cup: 'medium', temperature: 'ice', sugar: 'standard' });
const specQuantity = ref(1);

/** 饮品需要选择规格；非饮品直接加购 */
function onProductTap(p: Product) {
  if (p.soldOut) return;
  if (p.specs.length > 0) {
    specProduct.value = p;
    specSelection.value = { cup: 'medium', temperature: 'ice', sugar: 'standard' };
    specQuantity.value = 1;
    specPopupVisible.value = true;
  } else {
    addItem({
      productId: p.id,
      name: p.name,
      image: p.image,
      cup: null,
      temperature: null,
      sugar: null,
      price: p.price,
      quantity: 1,
    });
  }
}

const specPriceAdjustValue = computed(() => {
  if (!specProduct.value) return 0;
  return specPriceAdjust(
    specProduct.value.specs,
    specSelection.value.cup,
    specSelection.value.temperature,
    specSelection.value.sugar,
  );
});

/** 规格单价 = 基础价 + 规格加价（大杯 +3 元） */
const specUnitPrice = computed(() => {
  if (!specProduct.value) return 0;
  return unitPrice(specProduct.value.price, specPriceAdjustValue.value);
});

const specSummary = computed(() => specText(specSelection.value));

function confirmSpec() {
  const p = specProduct.value;
  if (!p) return;
  addItem({
    productId: p.id,
    name: p.name,
    image: p.image,
    cup: specSelection.value.cup,
    temperature: specSelection.value.temperature,
    sugar: specSelection.value.sugar,
    price: specUnitPrice.value,
    quantity: specQuantity.value,
  });
  specPopupVisible.value = false;
}

/* ---------- 购物车浮层 ---------- */
const cartPopupVisible = ref(false);

function toggleCart() {
  cartPopupVisible.value = !cartPopupVisible.value;
}

function goCheckout() {
  if (cartItems.length === 0) return;
  cartPopupVisible.value = false;
  uni.navigateTo({ url: '/pages/checkout/checkout' });
}

const cupOptions: { value: ProductSpec['cup']; label: string }[] = [
  { value: 'medium', label: '中杯' },
  { value: 'large', label: '大杯' },
];
const temperatureOptions: { value: ProductSpec['temperature']; label: string }[] = [
  { value: 'ice', label: '冰' },
  { value: 'hot', label: '热' },
];
const sugarOptions: { value: ProductSpec['sugar']; label: string }[] = [
  { value: 'none', label: '无糖' },
  { value: 'less', label: '少糖' },
  { value: 'standard', label: '标准糖' },
];
</script>

<template>
  <view class="page">
    <!-- 门店条 -->
    <view class="store-bar">
      <text class="store-name">{{ currentStore?.name ?? '选择门店' }}</text>
      <text class="store-status" :class="currentStore?.isOpen ? 'open' : 'closed'">
        {{ currentStore?.isOpen ? '营业中' : '休息中' }}
      </text>
    </view>

    <view class="main">
      <!-- 左侧分类 -->
      <scroll-view scroll-y class="category-list">
        <view
          v-for="c in categories"
          :key="c.id"
          class="category-item"
          :class="{ active: c.id === activeCategoryId }"
          @tap="onCategoryTap(c.id)"
        >
          <text class="category-name">{{ c.name }}</text>
        </view>
      </scroll-view>

      <!-- 右侧商品列表 -->
      <scroll-view
        scroll-y
        class="product-list"
        :scroll-into-view="scrollTo"
        @scroll="onScroll"
      >
        <view v-for="g in grouped" :key="g.category.id" :class="`section-${g.category.id}`">
          <view class="section-title">{{ g.category.name }}</view>
          <view
            v-for="p in g.items"
            :key="p.id"
            class="product-card"
            :class="{ 'is-soldout': p.soldOut }"
            @tap="onProductTap(p)"
          >
            <view class="product-art">
              <ProductArt :image="p.image" :name="p.name" />
            </view>
            <view class="product-info">
              <text class="product-name">{{ p.name }}</text>
              <text class="product-desc">{{ p.description }}</text>
              <view class="product-foot">
                <text class="product-price">{{ formatYuan(p.price) }}</text>
                <text v-if="p.soldOut" class="product-soldout">售罄</text>
                <text v-else-if="p.specs.length > 0" class="product-action">选规格</text>
                <text v-else class="product-action">加购</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 底部购物车浮层 -->
    <view class="cart-bar" @tap="toggleCart">
      <view class="cart-icon-wrap">
        <text class="cart-icon">🛒</text>
        <text v-if="totalQuantity > 0" class="cart-badge">
          {{ totalQuantity }}
        </text>
      </view>
      <view class="cart-amount">
        <text class="cart-total">{{ formatYuan(totalAmount) }}</text>
        <text class="cart-hint">{{ totalQuantity > 0 ? '点击查看购物车' : '未选购商品' }}</text>
      </view>
      <text
        class="cart-checkout"
        :class="{ disabled: cartItems.length === 0 }"
        @tap.stop="goCheckout"
      >
        去结算
      </text>
    </view>

    <!-- 购物车明细弹层 -->
    <view v-if="cartPopupVisible" class="popup-mask" @tap="toggleCart">
      <view class="popup-body" @tap.stop>
        <view class="popup-head">
          <text class="popup-title">购物车</text>
          <text class="popup-clear" @tap="clearCart()">清空</text>
        </view>
        <scroll-view scroll-y class="cart-items">
          <view v-for="item in cartItems" :key="`${item.productId}-${item.cup}-${item.temperature}-${item.sugar}`" class="cart-item">
            <view class="cart-item-info">
              <text class="cart-item-name">{{ item.name }}</text>
              <text class="cart-item-spec">{{ specText(item) }}</text>
              <text class="cart-item-price">{{ formatYuan(item.price) }}</text>
            </view>
            <view class="stepper">
              <text class="stepper-btn" @tap="setQuantity(item, item.quantity - 1)">−</text>
              <text class="stepper-num">{{ item.quantity }}</text>
              <text class="stepper-btn" @tap="setQuantity(item, item.quantity + 1)">＋</text>
            </view>
          </view>
        </scroll-view>
        <view class="popup-foot">
          <text class="popup-total">合计 {{ formatYuan(totalAmount) }}</text>
          <text class="popup-checkout" @tap="goCheckout">去结算</text>
        </view>
      </view>
    </view>

    <!-- 规格弹窗 -->
    <view v-if="specPopupVisible" class="popup-mask" @tap="specPopupVisible = false">
      <view class="popup-body spec-popup" @tap.stop>
        <view class="popup-head">
          <text class="popup-title">{{ specProduct?.name }}</text>
          <text class="popup-close" @tap="specPopupVisible = false">✕</text>
        </view>
        <scroll-view scroll-y class="spec-body">
          <view class="spec-group">
            <text class="spec-label">杯型</text>
            <view class="spec-options">
              <text
                v-for="o in cupOptions"
                :key="o.value"
                class="spec-option"
                :class="{ active: specSelection.cup === o.value }"
                @tap="specSelection.cup = o.value"
              >
                {{ o.label }}
              </text>
            </view>
          </view>
          <view class="spec-group">
            <text class="spec-label">温度</text>
            <view class="spec-options">
              <text
                v-for="o in temperatureOptions"
                :key="o.value"
                class="spec-option"
                :class="{ active: specSelection.temperature === o.value }"
                @tap="specSelection.temperature = o.value"
              >
                {{ o.label }}
              </text>
            </view>
          </view>
          <view class="spec-group">
            <text class="spec-label">糖度</text>
            <view class="spec-options">
              <text
                v-for="o in sugarOptions"
                :key="o.value"
                class="spec-option"
                :class="{ active: specSelection.sugar === o.value }"
                @tap="specSelection.sugar = o.value"
              >
                {{ o.label }}
              </text>
            </view>
          </view>
          <view class="spec-group">
            <text class="spec-label">数量</text>
            <view class="stepper">
              <text class="stepper-btn" @tap="specQuantity = Math.max(1, specQuantity - 1)">−</text>
              <text class="stepper-num">{{ specQuantity }}</text>
              <text class="stepper-btn" @tap="specQuantity = Math.min(99, specQuantity + 1)">＋</text>
            </view>
          </view>
        </scroll-view>
        <view class="popup-foot">
          <text class="popup-total">
            {{ specSummary }} · {{ formatYuan(specUnitPrice) }}
          </text>
          <text class="popup-checkout" @tap="confirmSpec">加入购物车</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '../../uni.scss';

.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $cream-50;
}

/* 门店条 */
.store-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 28rpx;
  background: #fff;
  border-bottom: 2rpx solid $brand-100;
}
.store-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $brand-900;
}
.store-status {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  &.open {
    color: $brand-600;
    background: $brand-50;
  }
  &.closed {
    color: #b0483e;
    background: #f9ecea;
  }
}

/* 主区域 */
.main {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 左侧分类 */
.category-list {
  width: 160rpx;
  background: $cream-100;
}
.category-item {
  padding: 28rpx 16rpx;
  text-align: center;
  &.active {
    background: $cream-50;
    .category-name {
      color: $brand-600;
      font-weight: 700;
    }
  }
}
.category-name {
  font-size: 26rpx;
  color: #5c6b60;
}

/* 右侧商品 */
.product-list {
  flex: 1;
  padding: 16rpx 20rpx 120rpx;
}
.section-title {
  font-size: 26rpx;
  font-weight: 700;
  color: $brand-900;
  padding: 16rpx 0 12rpx;
}
.product-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  border: 2rpx solid $brand-100;
  margin-bottom: 16rpx;
  overflow: hidden;
  &.is-soldout {
    opacity: 0.55;
  }
}
.product-art {
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
  background: $cream-50;
}
.product-info {
  flex: 1;
  padding: 16rpx;
  display: flex;
  flex-direction: column;
}
.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $brand-900;
}
.product-desc {
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.product-price {
  font-size: 30rpx;
  font-weight: 700;
  color: $caramel-600;
}
.product-soldout {
  font-size: 22rpx;
  color: #b0483e;
}
.product-action {
  font-size: 22rpx;
  color: $brand-600;
  background: $brand-50;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

/* 底部购物车条 */
.cart-bar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 24rpx;
  height: 96rpx;
  background: $brand-900;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  padding: 0 12rpx 0 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(30, 58, 41, 0.25);
  z-index: 10;
}
.cart-icon-wrap {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  background: $brand-600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-icon {
  font-size: 36rpx;
}
.cart-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: $caramel-500;
  color: #fff;
  font-size: 20rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}
.cart-amount {
  flex: 1;
  margin-left: 20rpx;
}
.cart-total {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}
.cart-hint {
  display: block;
  font-size: 20rpx;
  color: $cream-200;
}
.cart-checkout {
  background: $caramel-500;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  padding: 18rpx 36rpx;
  border-radius: 999rpx;
  &.disabled {
    background: #6b7280;
  }
}

/* 弹层 */
.popup-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}
.popup-body {
  width: 100%;
  max-height: 75vh;
  background: $cream-50;
  border-radius: 28rpx 28rpx 0 0;
  display: flex;
  flex-direction: column;
}
.popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx 16rpx;
}
.popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $brand-900;
}
.popup-close {
  font-size: 28rpx;
  color: #8a968d;
  padding: 8rpx;
}
.popup-clear {
  font-size: 24rpx;
  color: #b0483e;
}
.cart-items {
  flex: 1;
  padding: 0 32rpx;
  min-height: 120rpx;
}
.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 2rpx solid $cream-100;
}
.cart-item-info {
  flex: 1;
}
.cart-item-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: $brand-900;
}
.cart-item-spec {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 4rpx;
}
.cart-item-price {
  display: block;
  font-size: 26rpx;
  color: $caramel-600;
  margin-top: 6rpx;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.stepper-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: $brand-50;
  color: $brand-700;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stepper-num {
  font-size: 28rpx;
  color: $brand-900;
  min-width: 40rpx;
  text-align: center;
}
.popup-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
}
.popup-total {
  font-size: 30rpx;
  font-weight: 700;
  color: $brand-900;
}
.popup-checkout {
  background: $brand-600;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  padding: 20rpx 48rpx;
  border-radius: 999rpx;
}

/* 规格弹窗 */
.spec-body {
  padding: 0 32rpx;
}
.spec-group {
  padding: 20rpx 0;
}
.spec-label {
  display: block;
  font-size: 26rpx;
  color: #5c6b60;
  margin-bottom: 16rpx;
}
.spec-options {
  display: flex;
  gap: 16rpx;
}
.spec-option {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 26rpx;
  color: $brand-900;
  background: #fff;
  border: 2rpx solid $brand-100;
  border-radius: 12rpx;
  &.active {
    color: #fff;
    background: $brand-600;
    border-color: $brand-600;
  }
}
</style>
