import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, assertTransition } from '../src/utils/order.js';
import type { OrderStatus } from '../src/utils/order.js';

const validTransitions: Array<[OrderStatus, OrderStatus]> = [
  ['pending', 'paid'],
  ['pending', 'cancelled'],
  ['paid', 'making'],
  ['paid', 'cancelled'],
  ['making', 'ready'],
  ['ready', 'completed'],
];

const invalidTransitions: Array<[OrderStatus, OrderStatus]> = [
  ['pending', 'making'],
  ['pending', 'ready'],
  ['pending', 'completed'],
  ['paid', 'ready'],
  ['paid', 'completed'],
  ['paid', 'pending'],
  ['making', 'completed'],
  ['making', 'paid'],
  ['making', 'cancelled'],
  ['ready', 'paid'],
  ['ready', 'cancelled'],
  ['completed', 'paid'],
  ['completed', 'making'],
  ['completed', 'cancelled'],
  ['cancelled', 'paid'],
  ['cancelled', 'making'],
  ['cancelled', 'completed'],
];

test('合法状态流转', () => {
  for (const [from, to] of validTransitions) {
    assert.equal(canTransition(from, to), true, `${from} -> ${to}`);
  }
});

test('非法状态流转返回 false', () => {
  for (const [from, to] of invalidTransitions) {
    assert.equal(canTransition(from, to), false, `${from} -> ${to}`);
  }
});

test('assertTransition 合法流转不抛异常', () => {
  assert.doesNotThrow(() => assertTransition('pending', 'paid'));
  assert.doesNotThrow(() => assertTransition('ready', 'completed'));
});

test('assertTransition 非法流转抛异常', () => {
  assert.throws(() => assertTransition('pending', 'completed'), /非法的订单状态流转/);
  assert.throws(() => assertTransition('completed', 'paid'), /非法的订单状态流转/);
  assert.throws(() => assertTransition('cancelled', 'making'), /非法的订单状态流转/);
});
