<template>
  <view class="order-page">
    <view class="category-sidebar">
      <view
        v-for="cat in categories"
        :key="cat.id"
        :class="['cat-item', { active: activeCategory === cat.id }]"
        @tap="selectCategory(cat.id)"
      >
        {{ cat.name }}
      </view>
    </view>

    <view class="product-area">
      <scroll-view scroll-y class="product-scroll" :scroll-top="scrollTop" @scroll="onScroll">
        <view v-for="cat in categories" :key="cat.id" :id="'cat-' + cat.id" class="product-section">
          <text class="section-title">{{ cat.name }}</text>
          <view class="product-list">
            <view
              v-for="product in getProductsByCategory(cat.id)"
              :key="product.id"
              class="product-item"
            >
              <view class="p-img">
                <text class="p-icon">{{ product.name.charAt(0) }}</text>
                <view v-if="product.soldOut" class="p-soldout">售罄</view>
              </view>
              <view class="p-info">
                <text class="p-name">{{ product.name }}</text>
                <text class="p-desc">{{ product.description }}</text>
                <view class="p-bottom">
                  <text class="p-price">{{ formatYuan(product.price) }}</text>
                  <view v-if="!product.soldOut" class="p-add" @tap="openSpec(product)">选规格</view>
                  <view v-else class="p-add disabled">售罄</view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-if="cartCount > 0" class="cart-bar" @tap="showCart = true">
        <view class="cart-left">
          <view class="cart-badge">{{ cartCount }}</view>
          <text class="cart-total">{{ formatYuan(cartTotal) }}</text>
        </view>
        <view class="cart-btn">去结算</view>
      </view>
    </view>

    <view v-if="showSpecModal" class="spec-mask" @tap="showSpecModal = false">
      <view class="spec-modal" @tap.stop>
        <view class="spec-header">
          <text class="spec-title">{{ currentProduct?.name }}</text>
          <text class="spec-close" @tap="showSpecModal = false">×</text>
        </view>
        <view class="spec-body">
          <view class="spec-group">
            <text class="spec-label">杯型</text>
            <view class="spec-options">
              <text
                v-for="cup in ['medium', 'large']"
                :key="cup"
                :class="['spec-opt', { active: specForm.cupSize === cup }]"
                @tap="specForm.cupSize = cup; updateSpecPrice()"
              >{{ cup === 'medium' ? '中杯' : '大杯' }}</text>
            </view>
          </view>
          <view class="spec-group">
            <text class="spec-label">温度</text>
            <view class="spec-options">
              <text
                v-for="temp in ['hot', 'iced']"
                :key="temp"
                :class="['spec-opt', { active: specForm.temperature === temp }]"
                @tap="specForm.temperature = temp; updateSpecPrice()"
              >{{ temp === 'hot' ? '热' : '冰' }}</text>
            </view>
          </view>
          <view class="spec-group">
            <text class="spec-label">糖度</text>
            <view class="spec-options">
              <text
                v-for="sugar in ['none', 'less', 'standard']"
                :key="sugar"
                :class="['spec-opt', { active: specForm.sugar === sugar }]"
                @tap="specForm.sugar = sugar; updateSpecPrice()"
              >{{ sugar === 'standard' ? '标准' : sugar === 'less' ? '少糖' : '无糖' }}</text>
            </view>
          </view>
          <view class="spec-group">
            <text class="spec-label">数量</text>
            <view class="qty-ctrl">
              <text class="qty-btn" @tap="specForm.quantity > 1 && specForm.quantity--">-</text>
              <text class="qty-num">{{ specForm.quantity }}</text>
              <text class="qty-btn" @tap="specForm.quantity++">+</text>
            </view>
          </view>
        </view>
        <view class="spec-footer">
          <text class="spec-price">{{ formatYuan(specPrice * specForm.quantity) }}</text>
          <view class="spec-add" @tap="addToCart">加入购物车</view>
        </view>
      </view>
    </view>

    <view v-if="showCart" class="cart-mask" @tap="showCart = false">
      <view class="cart-panel" @tap.stop>
        <view class="cart-header">
          <text class="cart-title">购物车</text>
          <text class="cart-clear" @tap="cart = []">清空</text>
        </view>
        <view class="cart-list">
          <view v-for="(item, idx) in cart" :key="idx" class="cart-item">
            <text class="ci-name">{{ item.productName }}</text>
            <text class="ci-spec">{{ item.cupSize === 'medium' ? '中杯' : '大杯' }} · {{ item.temperature === 'hot' ? '热' : '冰' }} · {{ item.sugar === 'standard' ? '标准' : item.sugar === 'less' ? '少糖' : '无糖' }}</text>
            <view class="ci-right">
              <text class="ci-price">{{ formatYuan(item.unitPrice * item.quantity) }}</text>
              <view class="ci-qty">
                <text class="qty-btn" @tap="item.quantity > 1 ? item.quantity-- : cart.splice(idx, 1)">-</text>
                <text class="qty-num">{{ item.quantity }}</text>
                <text class="qty-btn" @tap="item.quantity++">+</text>
              </view>
            </view>
          </view>
        </view>
        <view class="cart-footer">
          <text class="cart-total-label">合计：{{ formatYuan(cartTotal) }}</text>
          <view class="cart-checkout" @tap="goCheckout">去结算</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { request, formatYuan } from '@/utils/request'

interface Category { id: number; name: string }
interface Product { id: number; categoryId: number; name: string; description: string; price: number; soldOut: boolean; specs?: any[] }
interface CartItem { productId: number; productName: string; cupSize: string; temperature: string; sugar: string; quantity: number; unitPrice: number }

const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const activeCategory = ref(0)
const scrollTop = ref(0)
const showSpecModal = ref(false)
const currentProduct = ref<Product | null>(null)
const specForm = ref({ cupSize: 'medium', temperature: 'hot', sugar: 'standard', quantity: 1 })
const specPrice = ref(0)
const showCart = ref(false)
const cart = ref<CartItem[]>([])

const cartCount = computed(() => cart.value.reduce((sum, i) => sum + i.quantity, 0))
const cartTotal = computed(() => cart.value.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))

onMounted(async () => {
  try {
    const [c, p] = await Promise.all([
      request<Category[]>('/categories'),
      request<Product[]>('/products'),
    ])
    categories.value = c
    products.value = p
    if (c.length > 0) activeCategory.value = c[0].id
  } catch {}
})

function getProductsByCategory(catId: number) {
  return products.value.filter((p) => p.categoryId === catId)
}

function selectCategory(id: number) {
  activeCategory.value = id
  scrollTop.value = 0
  setTimeout(() => {
    uni.createSelectorQuery().select('#cat-' + id).boundingClientRect()
    uni.createSelectorQuery().select('.product-area').boundingClientRect()
    exec((rects: any[]) => {
      if (rects[0] && rects[1]) {
        scrollTop.value = rects[0].top - rects[1].top
      }
    })
  }, 50)
}

function exec(cb: (rects: any[]) => void) {
  uni.createSelectorQuery().select('.product-scroll').scrollOffset().exec((res: any[]) => {
    cb([])
  })
}

function onScroll() {}

function openSpec(product: Product) {
  currentProduct.value = product
  specForm.value = { cupSize: 'medium', temperature: 'hot', sugar: 'standard', quantity: 1 }
  updateSpecPrice()
  showSpecModal.value = true
}

function updateSpecPrice() {
  if (!currentProduct.value) return
  const spec = currentProduct.value.specs?.find(
    (s: any) => s.cup_size === specForm.value.cupSize && s.temperature === specForm.value.temperature && s.sugar === specForm.value.sugar
  )
  const delta = spec?.price_delta ?? 0
  specPrice.value = currentProduct.value.price + delta
}

function addToCart() {
  if (!currentProduct.value) return
  const existing = cart.value.find(
    (i) => i.productId === currentProduct.value!.id && i.cupSize === specForm.value.cupSize && i.temperature === specForm.value.temperature && i.sugar === specForm.value.sugar
  )
  if (existing) {
    existing.quantity += specForm.value.quantity
  } else {
    cart.value.push({
      productId: currentProduct.value.id,
      productName: currentProduct.value.name,
      cupSize: specForm.value.cupSize,
      temperature: specForm.value.temperature,
      sugar: specForm.value.sugar,
      quantity: specForm.value.quantity,
      unitPrice: specPrice.value,
    })
  }
  showSpecModal.value = false
}

function goCheckout() {
  showCart.value = false
  uni.navigateTo({ url: '/pages/checkout/index?cart=' + encodeURIComponent(JSON.stringify(cart.value)) })
}
</script>

<style scoped>
.order-page {
  display: flex;
  height: 100vh;
  background: #FDF8F3;
}

.category-sidebar {
  width: 160rpx;
  background: #F5EFE9;
  padding-top: 24rpx;
}

.cat-item {
  padding: 24rpx 16rpx;
  font-size: 26rpx;
  color: #6B5B4F;
  text-align: center;
}

.cat-item.active {
  background: #FFFFFF;
  color: #8B4513;
  font-weight: 600;
  border-left: 4rpx solid #8B4513;
}

.product-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-scroll {
  flex: 1;
  padding: 16rpx;
}

.product-section {
  margin-bottom: 32rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #2C1810;
  margin-bottom: 16rpx;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.product-item {
  width: calc(50% - 8rpx);
  background: #FFFFFF;
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid #E8DDD4;
}

.p-img {
  height: 160rpx;
  background: #FDF8F3;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.p-icon {
  font-size: 40rpx;
  color: #8B4513;
  font-weight: 700;
}

.p-soldout {
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
  font-size: 22rpx;
}

.p-info {
  padding: 12rpx;
}

.p-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #2C1810;
}

.p-desc {
  display: block;
  font-size: 20rpx;
  color: #6B5B4F;
  margin-top: 4rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.p-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.p-price {
  font-size: 28rpx;
  font-weight: 700;
  color: #8B4513;
}

.p-add {
  padding: 6rpx 16rpx;
  background: #8B4513;
  color: white;
  font-size: 22rpx;
  border-radius: 999rpx;
}

.p-add.disabled {
  background: #CCCCCC;
}

.cart-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
  background: #2C1810;
  color: white;
}

.cart-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.cart-badge {
  background: #C0392B;
  color: white;
  font-size: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.cart-total {
  font-size: 32rpx;
  font-weight: 700;
}

.cart-btn {
  padding: 12rpx 32rpx;
  background: #8B4513;
  border-radius: 999rpx;
  font-size: 26rpx;
}

.spec-mask,
.cart-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.spec-modal {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.spec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.spec-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2C1810;
}

.spec-close {
  font-size: 40rpx;
  color: #6B5B4F;
  padding: 0 8rpx;
}

.spec-group {
  margin-bottom: 24rpx;
}

.spec-label {
  display: block;
  font-size: 26rpx;
  color: #6B5B4F;
  margin-bottom: 12rpx;
}

.spec-options {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.spec-opt {
  padding: 12rpx 28rpx;
  border: 1rpx solid #E8DDD4;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #2C1810;
  background: #FFFFFF;
}

.spec-opt.active {
  border-color: #8B4513;
  color: #8B4513;
  background: #FDF8F3;
  font-weight: 600;
}

.qty-ctrl {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.qty-btn {
  width: 48rpx;
  height: 48rpx;
  border: 1rpx solid #E8DDD4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.qty-num {
  font-size: 32rpx;
  font-weight: 600;
  min-width: 48rpx;
  text-align: center;
}

.spec-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 32rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #E8DDD4;
}

.spec-price {
  font-size: 40rpx;
  font-weight: 700;
  color: #8B4513;
}

.spec-add {
  padding: 16rpx 48rpx;
  background: #8B4513;
  color: white;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.cart-panel {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.cart-title {
  font-size: 32rpx;
  font-weight: 700;
}

.cart-clear {
  font-size: 24rpx;
  color: #C0392B;
}

.cart-list {
  flex: 1;
  overflow-y: auto;
}

.cart-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #E8DDD4;
}

.ci-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #2C1810;
}

.ci-spec {
  display: block;
  font-size: 20rpx;
  color: #6B5B4F;
  margin-top: 4rpx;
}

.ci-right {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.ci-price {
  font-size: 28rpx;
  font-weight: 700;
  color: #8B4513;
}

.ci-qty {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.cart-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #E8DDD4;
}

.cart-total-label {
  font-size: 32rpx;
  font-weight: 700;
  color: #2C1810;
}

.cart-checkout {
  padding: 16rpx 48rpx;
  background: #8B4513;
  color: white;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
}
</style>
