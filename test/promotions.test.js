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
import { getMembershipPlan, membershipPlans, tierForPoints } from '../src/storefront/promotions.js'

// Kiểm thử edge case: four earned membership tiers have exact thresholds and benefits.
test('four earned membership tiers have exact thresholds and benefits', () => {
  assert.deepEqual(membershipPlans.map((plan) => plan.points), [0, 100, 1000, 10000])
  assert.deepEqual(membershipPlans.map((plan) => plan.discount), [0, 1, 2, 5])
  assert.deepEqual(membershipPlans.map((plan) => plan.multiplier), [1, 1, 1.2, 1.5])
  assert.deepEqual([0, 99, 100, 999, 1000, 9999, 10000].map(tierForPoints),
    ['bronze', 'bronze', 'silver', 'silver', 'gold', 'gold', 'diamond'])
  assert.equal(getMembershipPlan('missing').id, 'bronze')
})
