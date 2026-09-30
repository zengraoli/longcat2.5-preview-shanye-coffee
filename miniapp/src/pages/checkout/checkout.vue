<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, ApiError } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { getSession } from '../../lib/auth';
import { currentStoreId, resolveStore } from '../../lib/shop';
import { computePromoDiscount } from '../../lib/promo';
import { couponDiscount, formatYuan, maskPhone, specText } from '../../lib/utils';
import type { Coupon, Store } from '../../lib/types';

const { items: cartItems, totalAmount, clear: clearCart } = useCart();

const stores = ref<Store[]>([]);
const type = ref<'pickup' | 'dine_in'>('pickup');
const remark = ref('');
const submitting = ref(false);

const coupons = ref<Coupon[]>([]);
/** 当前选中的优惠券 ID；null 表示不使用；'auto' 表示跟随最优券 */
const selectedCouponId = ref<number | 'auto' | null>('auto');
const couponPopupVisible = ref(false);
/** 活动适用商品集合（第二杯半价） */
const promoProductIds = ref<Set<number>>(new Set());

const currentStore = computed<Store | null>(() => resolveStore(stores.value));

const originalAmount = computed(() =>
  cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
);

/** 第二杯半价优惠（分），与 server 计算保持一致 */
const promoDiscount = computed(() =>
  computePromoDiscount(
    cartItems.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
    promoProductIds.value,
  ),
);

/** 活动后金额：优惠券的门槛判断与优惠金额基于此（先活动后券） */
const afterPromoAmount = computed(() => originalAmount.value - promoDiscount.value);

/** 当前选中优惠券的优惠金额（分），与 server 计算保持一致 */
const discountAmount = computed(() => {
  if (selectedCouponId.value === null) return 0;
  if (selectedCouponId.value === 'auto') {
    const best = bestCoupon.value;
    return best ? best.discount : 0;
  }
  const coupon = coupons.value.find((c) => c.id === selectedCouponId.value);
  if (!coupon || !coupon.usable) return 0;
  return couponDiscount(coupon, afterPromoAmount.value);
});

/** 实付 = 活动后金额 - 券优惠 */
const payableAmount = computed(() => Math.max(0, afterPromoAmount.value - discountAmount.value));

/** 最优券（用于默认推荐与“最优券”选项） */
const bestCoupon = computed(() => {
  let best: { coupon: Coupon; discount: number } | null = null;
  for (const c of coupons.value) {
    if (!c.usable) continue;
    const d = couponDiscount(c, afterPromoAmount.value);
    if (d <= 0) continue;
    if (!best || d > best.discount) best = { coupon: c, discount: d };
  }
  return best;
});

const selectedCouponText = computed(() => {
  if (selectedCouponId.value === null) return '不使用优惠券';
  if (selectedCouponId.value === 'auto') {
    return bestCoupon.value ? `最优券：${bestCoupon.value.coupon.name}` : '无可用优惠券';
  }
  const c = coupons.value.find((x) => x.id === selectedCouponId.value);
  return c ? c.name : '不使用优惠券';
});

onMounted(async () => {
  if (!getSession()) return;
  try {
    const [storeList, couponList, promo] = await Promise.all([
      api.get<Store[]>('/api/stores'),
      api.get<Coupon[]>('/api/member/coupons'),
      api.get<{ applicableProductIds: number[] }>('/api/promotions').catch(() => null),
    ]);
    stores.value = storeList;
    coupons.value = couponList;
    promoProductIds.value = new Set(promo?.applicableProductIds ?? []);
    // 默认选中可用优惠券中的最优券
    if (bestCoupon.value) {
      selectedCouponId.value = 'auto';
    }
  } catch {
    // 加载失败不阻塞结算，优惠券可后续重试
  }
});

function selectCoupon(id: number | 'auto' | null) {
  selectedCouponId.value = id;
  couponPopupVisible.value = false;
}

async function submitOrder() {
  const session = getSession();
  if (!session) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  const store = currentStore.value;
  if (!store) {
    uni.showToast({ title: '门店信息缺失', icon: 'none' });
    return;
  }
  if (cartItems.length === 0) {
    uni.showToast({ title: '购物车为空', icon: 'none' });
    return;
  }
  if (!store.isOpen) {
    uni.showToast({ title: '门店休息中，暂不可下单', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    const couponId =
      selectedCouponId.value === 'auto'
        ? bestCoupon.value?.coupon.id
        : selectedCouponId.value;
    const order = await api.post<{
      id: number;
      status: string;
      payableAmount: number;
    }>('/api/orders', {
      store_id: store.id,
      type: type.value,
      items: cartItems.map((i) => {
        const item: Record<string, unknown> = {
          product_id: i.productId,
          quantity: i.quantity,
        };
        // 饮品传规格；非饮品不传（server schema 要求 string，传 null 会报错）
        if (i.cup) item.cup = i.cup;
        if (i.temperature) item.temperature = i.temperature;
        if (i.sugar) item.sugar = i.sugar;
        return item;
      }),
      // 显式不使用传 0；使用最优券/指定券传 ID；不传则 server 自动推荐
      coupon_id: couponId === null ? 0 : couponId,
      remark: remark.value || undefined,
    });
    // 模拟支付：创建后立即支付
    await api.post(`/api/orders/${order.id}/pay`);
    clearCart();
    uni.redirectTo({ url: `/pages/orderDetail/orderDetail?id=${order.id}` });
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : '下单失败，请稍后重试';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

function goProfile() {
  uni.navigateTo({ url: '/pages/profile/profile' });
}

const sessionPhone = computed(() => {
  const s = getSession();
  return s ? maskPhone(s.member.phone) : '';
});
</script>

<template>
  <view class="page">
    <!-- 未登录提示 -->
    <view v-if="!getSession()" class="login-tip">
      <text class="login-tip-text">登录后即可结算</text>
      <text class="login-tip-btn" @tap="goProfile">去登录</text>
    </view>

    <block v-else>
      <!-- 取餐方式 -->
      <view class="card">
        <text class="card-title">取餐方式</text>
        <view class="type-options">
          <view
            class="type-option"
            :class="{ active: type === 'pickup' }"
            @tap="type = 'pickup'"
          >
            <text class="type-name">自提</text>
            <text class="type-desc">到店出示取餐码</text>
          </view>
          <view
            class="type-option"
            :class="{ active: type === 'dine_in' }"
            @tap="type = 'dine_in'"
          >
            <text class="type-name">堂食</text>
            <text class="type-desc">店内用餐</text>
          </view>
        </view>
        <view class="store-line">
          <text class="store-line-name">{{ currentStore?.name }}</text>
          <text class="store-line-status" :class="currentStore?.isOpen ? 'open' : 'closed'">
            {{ currentStore?.isOpen ? '营业中' : '休息中' }}
          </text>
        </view>
        <text class="store-line-addr">{{ currentStore?.address }}</text>
      </view>

      <!-- 商品清单 -->
      <view class="card">
        <text class="card-title">商品清单</text>
        <view
          v-for="item in cartItems"
          :key="`${item.productId}-${item.cup}-${item.temperature}-${item.sugar}`"
          class="order-item"
        >
          <view class="order-item-info">
            <text class="order-item-name">{{ item.name }}</text>
            <text class="order-item-spec">{{ specText(item) }}</text>
          </view>
          <view class="order-item-right">
            <text class="order-item-price">{{ formatYuan(item.price) }}</text>
            <text class="order-item-qty">×{{ item.quantity }}</text>
          </view>
        </view>
      </view>

      <!-- 优惠券 -->
      <view class="card" @tap="couponPopupVisible = true">
        <text class="card-title">优惠券</text>
        <view class="coupon-row">
          <text class="coupon-selected">{{ selectedCouponText }}</text>
          <text class="coupon-discount" :class="{ none: discountAmount === 0 }">
            {{ discountAmount > 0 ? `-${formatYuan(discountAmount)}` : '无优惠' }}
          </text>
        </view>
      </view>

      <!-- 备注 -->
      <view class="card">
        <text class="card-title">备注</text>
        <input
          v-model="remark"
          class="remark-input"
          placeholder="口味偏好、少冰等（选填）"
          maxlength="200"
        />
      </view>

      <!-- 金额明细 -->
      <view class="card">
        <view class="amount-row">
          <text class="amount-label">商品原价</text>
          <text class="amount-value">{{ formatYuan(originalAmount) }}</text>
        </view>
        <view v-if="promoDiscount > 0" class="amount-row">
          <text class="amount-label">活动优惠（第二杯半价）</text>
          <text class="amount-value discount">-{{ formatYuan(promoDiscount) }}</text>
        </view>
        <view class="amount-row">
          <text class="amount-label">优惠券优惠</text>
          <text class="amount-value discount">-{{ formatYuan(discountAmount) }}</text>
        </view>
        <view class="amount-row total">
          <text class="amount-label">实付</text>
          <text class="amount-value payable">{{ formatYuan(payableAmount) }}</text>
        </view>
      </view>

      <!-- 底部提交栏 -->
      <view class="footer">
        <view class="footer-amount">
          <text class="footer-total">{{ formatYuan(payableAmount) }}</text>
          <text class="footer-account">{{ sessionPhone }}</text>
        </view>
        <text class="footer-submit" :class="{ disabled: submitting }" @tap="submitOrder">
          {{ submitting ? '提交中…' : '提交订单' }}
        </text>
      </view>

      <!-- 优惠券选择弹窗 -->
      <view v-if="couponPopupVisible" class="popup-mask" @tap="couponPopupVisible = false">
        <view class="popup-body" @tap.stop>
          <view class="popup-head">
            <text class="popup-title">选择优惠券</text>
            <text class="popup-close" @tap="couponPopupVisible = false">✕</text>
          </view>
          <scroll-view scroll-y class="coupon-list">
            <view
              class="coupon-option"
              :class="{ active: selectedCouponId === 'auto' }"
              @tap="selectCoupon('auto')"
            >
              <view class="coupon-option-info">
                <text class="coupon-option-name">最优券（推荐）</text>
                <text class="coupon-option-desc">
                  {{ bestCoupon ? `满${formatYuan(bestCoupon.coupon.threshold)}可用，减${formatYuan(bestCoupon.discount)}` : '当前无可用优惠券' }}
                </text>
              </view>
              <text v-if="bestCoupon" class="coupon-option-discount">-{{ formatYuan(bestCoupon.discount) }}</text>
            </view>
            <view
              v-for="c in coupons.filter((x) => x.usable)"
              :key="c.id"
              class="coupon-option"
              :class="{ active: selectedCouponId === c.id }"
              @tap="selectCoupon(c.id)"
            >
              <view class="coupon-option-info">
                <text class="coupon-option-name">{{ c.name }}</text>
                <text class="coupon-option-desc">
                  {{ c.type === 'full_reduction' ? `满${formatYuan(c.threshold)}减${formatYuan(c.discountAmount ?? 0)}` : `${c.discountRate}折` }}
                </text>
              </view>
              <text class="coupon-option-discount">-{{ formatYuan(couponDiscount(c, afterPromoAmount)) }}</text>
            </view>
            <view
              class="coupon-option"
              :class="{ active: selectedCouponId === null }"
              @tap="selectCoupon(null)"
            >
              <view class="coupon-option-info">
                <text class="coupon-option-name">不使用优惠券</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </block>
  </view>
</template>

<style lang="scss" scoped>
@import '../../uni.scss';

.page {
  min-height: 100vh;
  background: $cream-50;
  padding: 20rpx 24rpx 160rpx;
}

.login-tip {
  margin-top: 200rpx;
  text-align: center;
}
.login-tip-text {
  display: block;
  font-size: 30rpx;
  color: #5c6b60;
}
.login-tip-btn {
  display: inline-block;
  margin-top: 32rpx;
  background: $brand-600;
  color: #fff;
  font-size: 28rpx;
  padding: 20rpx 56rpx;
  border-radius: 999rpx;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  border: 2rpx solid $brand-100;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
}
.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: $brand-900;
  margin-bottom: 20rpx;
}

/* 取餐方式 */
.type-options {
  display: flex;
  gap: 20rpx;
}
.type-option {
  flex: 1;
  border: 2rpx solid $brand-100;
  border-radius: 16rpx;
  padding: 24rpx;
  &.active {
    border-color: $brand-600;
    background: $brand-50;
  }
}
.type-name {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $brand-900;
}
.type-desc {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 8rpx;
}
.store-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid $cream-100;
}
.store-line-name {
  font-size: 26rpx;
  font-weight: 600;
  color: $brand-900;
}
.store-line-status {
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
.store-line-addr {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 8rpx;
}

/* 商品清单 */
.order-item {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 2rpx solid $cream-100;
  &:last-child {
    border-bottom: none;
  }
}
.order-item-info {
  flex: 1;
}
.order-item-name {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: $brand-900;
}
.order-item-spec {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 4rpx;
}
.order-item-right {
  text-align: right;
  margin-left: 16rpx;
}
.order-item-price {
  display: block;
  font-size: 26rpx;
  color: $brand-900;
}
.order-item-qty {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 4rpx;
}

/* 优惠券 */
.coupon-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.coupon-selected {
  font-size: 26rpx;
  color: $brand-900;
}
.coupon-discount {
  font-size: 26rpx;
  color: $caramel-600;
  &.none {
    color: #8a968d;
  }
}

/* 备注 */
.remark-input {
  background: $cream-50;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  font-size: 26rpx;
  color: $brand-900;
}

/* 金额明细 */
.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
  &.total {
    border-top: 2rpx solid $cream-100;
    margin-top: 8rpx;
    padding-top: 20rpx;
  }
}
.amount-label {
  font-size: 26rpx;
  color: #5c6b60;
}
.amount-value {
  font-size: 26rpx;
  color: $brand-900;
  &.discount {
    color: $caramel-600;
  }
  &.payable {
    font-size: 34rpx;
    font-weight: 700;
  }
}

/* 底部提交栏 */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top: 2rpx solid $brand-100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  z-index: 10;
}
.footer-amount {
  flex: 1;
}
.footer-total {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $brand-900;
}
.footer-account {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 4rpx;
}
.footer-submit {
  background: $brand-600;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  padding: 22rpx 56rpx;
  border-radius: 999rpx;
  &.disabled {
    background: #6b7280;
  }
}

/* 优惠券弹窗 */
.popup-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}
.popup-body {
  width: 100%;
  max-height: 70vh;
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
.coupon-list {
  flex: 1;
  padding: 0 32rpx 32rpx;
}
.coupon-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 2rpx solid $brand-100;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  &.active {
    border-color: $brand-600;
    background: $brand-50;
  }
}
.coupon-option-info {
  flex: 1;
}
.coupon-option-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: $brand-900;
}
.coupon-option-desc {
  display: block;
  font-size: 22rpx;
  color: #8a968d;
  margin-top: 6rpx;
}
.coupon-option-discount {
  font-size: 28rpx;
  font-weight: 700;
  color: $caramel-600;
  margin-left: 16rpx;
}
</style>
