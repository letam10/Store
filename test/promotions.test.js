/**
 * @codex-vn-doc
 * Tệp: test/promotions.test.js
 * Mục đích: Tệp kiểm thử tự động cho các luồng chính và tình huống biên của module này.
 * Thành phần chính: các hàm/lớp và xử lý nội bộ trong tệp.
 * Liên kết trực tiếp: node:assert/strict, node:test, ../src/storefront/promotions.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { getMembershipPlan, membershipPlans, tierForPoints, storePromotionOverview } from '../src/storefront/promotions.js'

// Kiểm thử edge case: four earned membership tiers have exact thresholds and benefits.
test('four earned membership tiers have exact thresholds and benefits', () => {
  assert.deepEqual(membershipPlans.map((plan) => plan.points), [0, 100, 1000, 10000])
  assert.deepEqual(membershipPlans.map((plan) => plan.discount), [0, 1, 2, 5])
  assert.deepEqual(membershipPlans.map((plan) => plan.multiplier), [1, 1, 1.2, 1.5])
  assert.deepEqual([0, 99, 100, 999, 1000, 9999, 10000].map(tierForPoints),
    ['bronze', 'bronze', 'silver', 'silver', 'gold', 'gold', 'diamond'])
  assert.equal(getMembershipPlan('missing').id, 'bronze')
})

test('ưu đãi chỉ quảng bá hàng còn kho, mã còn hạn và quyền lợi đúng hạng', () => {
  const products = [
    { id: 'sold', price: 100, stockCount: 0, discountPercent: 90 },
    { id: 'normal', price: 100, stockCount: 10, discountPercent: 0 },
    { id: 'sale', price: 200, stockCount: 10, discountPercent: 15 },
    { id: 'favorite', price: 300, stockCount: 1, discountPercent: 20 },
  ]
  const wallet = [
    { code: 'EXPIRED', expiresAt: '2026-10-04T00:00:00Z' },
    { code: 'VALID', expiresAt: '2026-11-04T00:00:00Z' },
    { code: 'INVALID', expiresAt: 'không có ngày' },
  ]
  const now = new Date('2026-10-04T00:00:00Z').getTime()
  const result = storePromotionOverview(products, wallet, { tier: 'gold', points: 1780 }, ['favorite'], now)
  assert.deepEqual(result.sales.map(product => product.id), ['favorite', 'sale'])
  assert.equal(result.maxDiscount, 20)
  assert.deepEqual(result.favoriteSales.map(product => product.id), ['favorite'])
  assert.deepEqual(result.vouchers.map(voucher => voucher.code), ['VALID'])
  assert.equal(result.plan.discount, 2)
  assert.equal(result.nextPlan.discount, 5)
  assert.equal(result.remainingPoints, 8220)
  assert.deepEqual(products.map(product => product.id), ['sold', 'normal', 'sale', 'favorite'])
  assert.deepEqual(storePromotionOverview(products, wallet, null, [], now).vouchers, [])
  assert.equal(storePromotionOverview([], [], { tier: 'diamond', points: 12000 }).nextPlan, null)
  assert.equal(storePromotionOverview().maxDiscount, 0)
})
