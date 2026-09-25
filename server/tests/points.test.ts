import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMemberLevel, calcPointsFromAmount } from '../src/utils/points.js';

test('银卡：0 分', () => {
  assert.equal(getMemberLevel(0), '银卡');
  assert.equal(getMemberLevel(499), '银卡');
});

test('金卡：500 分', () => {
  assert.equal(getMemberLevel(500), '金卡');
  assert.equal(getMemberLevel(1999), '金卡');
});

test('黑卡：2000 分', () => {
  assert.equal(getMemberLevel(2000), '黑卡');
  assert.equal(getMemberLevel(5000), '黑卡');
});

test('积分计算：每 1 元积 1 分', () => {
  assert.equal(calcPointsFromAmount(100), 1);
  assert.equal(calcPointsFromAmount(250), 2);
  assert.equal(calcPointsFromAmount(999), 9);
  assert.equal(calcPointsFromAmount(1000), 10);
  assert.equal(calcPointsFromAmount(0), 0);
});
