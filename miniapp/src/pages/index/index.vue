<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../../lib/api';
import { formatYuan, selectRecommendations } from '../../lib/utils';
import { usePromoProducts } from '../../lib/promoState';
import { currentStoreId, setCurrentStoreId } from '../../lib/shop';
import type { Product, Store } from '../../lib/types';
import ProductArt from '../../components/ProductArt.vue';

const { refreshPromoProducts, isPromoProduct } = usePromoProducts();

const stores = ref<Store[]>([]);
const products = ref<Product[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [storeList, productList] = await Promise.all([
      api.get<Store[]>('/api/stores'),
      api.get<Product[]>('/api/products'),
    ]);
    stores.value = storeList;
    products.value = productList;
    refreshPromoProducts();
    // 默认选中第一家营业门店（同步到 shop，供点单/确认订单页使用）
    const firstOpen = storeList.find((s) => s.isOpen);
    setCurrentStoreId((firstOpen ?? storeList[0])?.id ?? 0);
  } finally {
    loading.value = false;
  }
});

const currentStore = computed<Store | null>(
  () => stores.value.find((s) => s.id === currentStoreId.value) ?? null,
);

/** 推荐商品随门店切换而变化（见 selectRecommendations） */
const recommended = computed<Product[]>(() =>
  selectRecommendations(products.value, currentStoreId.value, 4).map(
    (p) => products.value.find((it) => it.id === p.id)!,
  ),
);

function selectStore(id: number) {
  setCurrentStoreId(id);
}

function goOrder() {
  uni.navigateTo({ url: '/pages/order/order' });
}

const banners = [
  {
    id: 1,
    title: '高山庄园 · 当季风味',
    sub: '海拔 1200m 以上庄园直采，下单前 24 小时内新鲜烘焙',
    bg: 'linear-gradient(135deg, #356a47 0%, #244530 100%)',
  },
  {
    id: 2,
    title: '手冲 · 耶加雪菲',
    sub: '埃塞俄比亚日晒豆，柑橘与花香，本周推荐',
    bg: 'linear-gradient(135deg, #c9853c 0%, #b06f2c 100%)',
  },
  {
    id: 3,
    title: '轻食搭档',
    sub: '可颂、贝果与三明治，与好咖啡刚刚好',
    bg: 'linear-gradient(135deg, #6aa37b 0%, #48855c 100%)',
  },
];
</script>

<template>
  <view class="page">
    <!-- 门店选择 -->
    <view class="store-bar">
      <scroll-view scroll-x class="store-scroll" :show-scrollbar="false">
        <view class="store-chips">
          <view
            v-for="s in stores"
            :key="s.id"
            class="store-chip"
            :class="{ active: s.id === currentStoreId }"
            @tap="selectStore(s.id)"
          >
            <text class="store-chip-name">{{ s.name }}</text>
            <text class="store-chip-status" :class="s.isOpen ? 'open' : 'closed'">
              {{ s.isOpen ? '营业中' : '休息中' }}
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 轮播 -->
    <swiper
      class="banner"
      circular
      autoplay
      interval="4000"
      duration="500"
      @change="() => {}"
    >
      <swiper-item v-for="b in banners" :key="b.id">
        <view class="banner-item" :style="{ background: b.bg }">
          <text class="banner-title">{{ b.title }}</text>
          <text class="banner-sub">{{ b.sub }}</text>
        </view>
      </swiper-item>
    </swiper>

    <!-- 当前门店信息 -->
    <view v-if="currentStore" class="store-card">
      <view class="store-card-head">
        <text class="store-name">{{ currentStore.name }}</text>
        <text class="store-status" :class="currentStore.isOpen ? 'open' : 'closed'">
          {{ currentStore.isOpen ? '营业中' : '休息中' }}
        </text>
      </view>
      <text class="store-addr">{{ currentStore.address }}</text>
      <text class="store-hours">营业时间 {{ currentStore.openTime }} - {{ currentStore.closeTime }}</text>
    </view>

    <!-- 推荐商品 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">推荐商品</text>
        <text class="section-sub">随门店切换更新</text>
      </view>
      <view v-if="loading" class="product-grid">
        <view v-for="i in 4" :key="i" class="product-card skeleton" />
      </view>
      <view v-else class="product-grid">
        <view
          v-for="p in recommended"
          :key="p.id"
          class="product-card"
          :class="{ 'is-soldout': p.soldOut }"
          @tap="goOrder"
        >
          <view class="product-art">
            <ProductArt :image="p.image" :name="p.name" />
          </view>
          <view class="product-info">
            <view class="product-name-row">
              <text class="product-name">{{ p.name }}</text>
              <text v-if="isPromoProduct(p.id)" class="promo-tag">第二杯半价</text>
            </view>
            <text class="product-desc">{{ p.description }}</text>
            <text class="product-price">{{ formatYuan(p.price) }}</text>
          </view>
        </view>
      </view>
      <view v-if="!loading && recommended.length === 0" class="empty">
        <text class="empty-text">暂无推荐商品</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '../../uni.scss';

.page {
  padding-bottom: 40rpx;
}

/* 门店选择 */
.store-bar {
  background: $cream-50;
  padding: 20rpx 0;
}
.store-scroll {
  white-space: nowrap;
  width: 100%;
}
.store-chips {
  display: inline-flex;
  padding: 0 24rpx;
  gap: 16rpx;
}
.store-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 28rpx;
  background: #fff;
  border: 2rpx solid $brand-100;
  border-radius: 16rpx;
  &.active {
    background: $brand-600;
    border-color: $brand-600;
    .store-chip-name {
      color: #fff;
    }
    .store-chip-status {
      color: $cream-100;
      &.closed {
        color: #f0c9c9;
      }
    }
  }
}
.store-chip-name {
  font-size: 26rpx;
  color: $brand-900;
  font-weight: 600;
}
.store-chip-status {
  font-size: 20rpx;
  margin-top: 6rpx;
  &.open {
    color: $brand-500;
  }
  &.closed {
    color: #b0483e;
  }
}

/* 轮播 */
.banner {
  height: 300rpx;
  margin: 24rpx;
  border-radius: 24rpx;
  overflow: hidden;
}
.banner-item {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 48rpx;
}
.banner-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}
.banner-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 16rpx;
  line-height: 1.5;
}

/* 当前门店卡片 */
.store-card {
  margin: 0 24rpx 24rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid $brand-100;
}
.store-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.store-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $brand-900;
}
.store-status {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
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
.store-addr {
  display: block;
  font-size: 24rpx;
  color: #5c6b60;
  margin-top: 16rpx;
}
.store-hours {
  display: block;
  font-size: 24rpx;
  color: #5c6b60;
  margin-top: 8rpx;
}

/* 推荐商品 */
.section {
  padding: 0 24rpx;
}
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: $brand-900;
}
.section-sub {
  font-size: 22rpx;
  color: #8a968d;
}
.product-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.product-card {
  width: calc(50% - 10rpx);
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid $brand-100;
  overflow: hidden;
  &.is-soldout {
    opacity: 0.55;
  }
  &.skeleton {
    height: 360rpx;
    background: linear-gradient(100deg, $cream-100 40%, #fff 50%, $cream-100 60%);
    background-size: 200% 100%;
    animation: skeleton 1.2s infinite;
  }
}
@keyframes skeleton {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -80% 0;
  }
}
.product-art {
  width: 100%;
  height: 240rpx;
  background: $cream-50;
}
.product-info {
  padding: 20rpx;
}
.product-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $brand-900;
}
.promo-tag {
  font-size: 18rpx;
  color: $caramel-600;
  background: #faf0e3;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
  flex-shrink: 0;
}
.product-desc {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-price {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $caramel-600;
  margin-top: 12rpx;
}
.empty {
  padding: 60rpx 0;
  text-align: center;
}
.empty-text {
  font-size: 26rpx;
  color: #8a968d;
}
</style>
