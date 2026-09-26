<template>
  <view class="home-page">
    <view class="store-bar">
      <view class="store-label">当前门店</view>
      <picker :range="storeNames" :value="selectedStoreIndex" @change="onStoreChange">
        <view class="store-picker">
          <text class="store-name">{{ currentStore?.name || '选择门店' }}</text>
          <text class="store-status" :class="currentStore?.status">
            {{ currentStore?.status === 'open' ? '营业中' : '休息中' }}
          </text>
        </view>
      </picker>
    </view>

    <swiper v-if="banners.length" class="banner" circular autoplay interval="3000" indicator-dots indicator-active-color="#8B4513">
      <swiper-item v-for="(item, index) in banners" :key="index">
        <view class="banner-item" :style="{ background: item.bg }">
          <view class="banner-text">
            <text class="banner-title">{{ item.title }}</text>
            <text class="banner-desc">{{ item.desc }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <view class="section-header">
      <text class="section-title">推荐商品</text>
    </view>

    <view class="product-grid">
      <view
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @tap="goToOrder"
      >
        <view class="product-img">
          <text class="product-icon">{{ product.name.charAt(0) }}</text>
          <view v-if="product.soldOut" class="soldout-mask">售罄</view>
        </view>
        <view class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <text class="product-desc">{{ product.description }}</text>
          <view class="product-bottom">
            <text class="product-price">{{ formatYuan(product.price) }}</text>
            <text v-if="product.soldOut" class="product-tag soldout">已售罄</text>
            <text v-else class="product-tag">可点</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="products.length === 0 && !loading" class="empty">
      <text>暂无商品</text>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { request, formatYuan } from '@/utils/request'
import { formatPromoRange } from '@/utils/promo'

interface Store {
  id: number
  name: string
  status: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  soldOut: boolean
}

interface ActivePromotion {
  id: number
  name: string
  startTime: string
  endTime: string
  productIds: number[]
  products: Product[]
}

const stores = ref<Store[]>([])
const products = ref<Product[]>([])
const promotion = ref<ActivePromotion | null>(null)
const selectedStoreIndex = ref(0)
const loading = ref(true)

const banners = computed(() => {
  if (!promotion.value) return []
  const names = promotion.value.products.map((p) => p.name).join('、')
  return [
    {
      title: promotion.value.name,
      desc: `参与商品：${names} · ${formatPromoRange(promotion.value.startTime, promotion.value.endTime)}`,
      bg: '#C05F2E',
    },
  ]
})

const storeNames = computed(() => stores.value.map((s) => s.name))
const currentStore = computed(() => stores.value[selectedStoreIndex.value])

onMounted(async () => {
  try {
    const [storeList, promo] = await Promise.all([
      request<Store[]>('/stores'),
      request<ActivePromotion | null>('/promotions/active'),
    ])
    stores.value = storeList
    promotion.value = promo
    await loadProducts()
  } catch {} finally {
    loading.value = false
  }
})

async function loadProducts() {
  if (!currentStore.value) return
  try {
    const list = await request<Product[]>('/products')
    products.value = list.filter((p) => !p.soldOut).slice(0, 6)
  } catch {}
}

function onStoreChange(e: any) {
  selectedStoreIndex.value = Number(e.detail.value)
  loadProducts()
}

function goToOrder() {
  uni.switchTab({ url: '/pages/order/index' })
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #FDF8F3;
}

.store-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 32rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #E8DDD4;
}

.store-label {
  font-size: 24rpx;
  color: #6B5B4F;
  margin-right: 16rpx;
}

.store-picker {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.store-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #2C1810;
}

.store-status {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  background: #E8F5E9;
  color: #2E7D32;
}

.store-status.closed {
  background: #FFEBEE;
  color: #C62828;
}

.banner {
  height: 300rpx;
  margin: 24rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.banner-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-text {
  text-align: center;
}

.banner-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #5C2E0A;
}

.banner-desc {
  display: block;
  font-size: 24rpx;
  color: #8B4513;
  margin-top: 8rpx;
}

.section-header {
  padding: 24rpx 32rpx 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2C1810;
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 24rpx;
  gap: 20rpx;
}

.product-card {
  width: calc(50% - 10rpx);
  background: #FFFFFF;
  border-radius: 16rpx;
  overflow: hidden;
  border: 1rpx solid #E8DDD4;
}

.product-img {
  height: 200rpx;
  background: #FDF8F3;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.product-icon {
  font-size: 48rpx;
  color: #8B4513;
  font-weight: 700;
}

.soldout-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24rpx;
}

.product-info {
  padding: 16rpx;
}

.product-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #2C1810;
}

.product-desc {
  display: block;
  font-size: 22rpx;
  color: #6B5B4F;
  margin-top: 4rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.product-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #8B4513;
}

.product-tag {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  background: #E8F5E9;
  color: #2E7D32;
}

.product-tag.soldout {
  background: #FFEBEE;
  color: #C62828;
}

.empty,
.loading {
  text-align: center;
  padding: 80rpx 0;
  color: #6B5B4F;
  font-size: 28rpx;
}
</style>
