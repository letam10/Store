import assert from 'node:assert/strict'
import test from 'node:test'
import { getMembershipPlan, membershipPlans, tierForPoints } from '../src/storefront/promotions.js'

test('four earned membership tiers have exact thresholds and benefits', () => {
  assert.deepEqual(membershipPlans.map((plan) => plan.points), [0, 100, 1000, 10000])
  assert.deepEqual(membershipPlans.map((plan) => plan.discount), [0, 1, 2, 5])
  assert.deepEqual(membershipPlans.map((plan) => plan.multiplier), [1, 1, 1.2, 1.5])
  assert.deepEqual([0, 99, 100, 999, 1000, 9999, 10000].map(tierForPoints),
    ['bronze', 'bronze', 'silver', 'silver', 'gold', 'gold', 'diamond'])
  assert.equal(getMembershipPlan('missing').id, 'bronze')
})
