import { beforeEach, describe, expect, it } from 'vitest';
import { useCart } from './cart';

describe('购物车 store', () => {
  beforeEach(() => {
    useCart().clear();
  });

  it('加购同商品同规格合并数量', () => {
    const cart = useCart();
    const item = {
      productId: 1,
      name: '美式',
      image: null,
      cup: 'medium',
      temperature: 'ice',
      sugar: 'standard',
      price: 2200,
      quantity: 1,
    };
    cart.addItem(item);
    cart.addItem({ ...item });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  it('加购不同规格不合并', () => {
    const cart = useCart();
    cart.addItem({
      productId: 1,
      name: '美式',
      image: null,
      cup: 'medium',
      temperature: 'ice',
      sugar: 'standard',
      price: 2200,
      quantity: 1,
    });
    cart.addItem({
      productId: 1,
      name: '美式',
      image: null,
      cup: 'large',
      temperature: 'ice',
      sugar: 'standard',
      price: 2500,
      quantity: 1,
    });
    expect(cart.items).toHaveLength(2);
  });

  it('数量加减与删除', () => {
    const cart = useCart();
    const item = {
      productId: 1,
      name: '美式',
      image: null,
      cup: 'medium',
      temperature: 'ice',
      sugar: 'standard',
      price: 2200,
      quantity: 2,
    };
    cart.addItem(item);
    cart.setQuantity(item, 3);
    expect(cart.items[0].quantity).toBe(3);
    cart.setQuantity(item, 0);
    expect(cart.items).toHaveLength(0);
  });

  it('合计金额与数量', () => {
    const cart = useCart();
    cart.addItem({
      productId: 1,
      name: '美式',
      image: null,
      cup: 'medium',
      temperature: 'ice',
      sugar: 'standard',
      price: 2200,
      quantity: 2,
    });
    cart.addItem({
      productId: 15,
      name: '可颂',
      image: null,
      cup: null,
      temperature: null,
      sugar: null,
      price: 1500,
      quantity: 1,
    });
    expect(cart.totalQuantity.value).toBe(3);
    expect(cart.totalAmount.value).toBe(5900);
  });

  it('清空购物车', () => {
    const cart = useCart();
    cart.addItem({
      productId: 1,
      name: '美式',
      image: null,
      cup: 'medium',
      temperature: 'ice',
      sugar: 'standard',
      price: 2200,
      quantity: 1,
    });
    cart.clear();
    expect(cart.items).toHaveLength(0);
    expect(cart.totalQuantity.value).toBe(0);
  });
});
