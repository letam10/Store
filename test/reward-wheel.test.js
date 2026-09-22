import test from 'node:test'
import assert from 'node:assert/strict'
import { rewardSectors, pickSector, landingRotation, sectorAtPointer, sectorResult } from '../src/storefront/rewardWheel.js'

test('every sector lands at the top pointer after at least six full turns', () => {
  for (const tier of ['standard', 'vip', 'elite']) {
    let rotation = 0
    for (let turn = 0; turn < 60; turn++) {
      const sector = rewardSectors(tier)[turn % 6]
      const next = landingRotation(rotation, sector.id)
      assert.ok(next - rotation >= 2160)
      assert.equal(sectorAtPointer(next), sector.id)
      const result = sectorResult(sector)
      assert.equal(result.sectorId, sectorAtPointer(next))
      assert.equal(result.voucher?.code || null, sector.code)
      rotation = next
    }
  }
})

test('equal sector probabilities match visible rewards and membership', () => {
  for (const [tier, misses] of [['standard',4],['vip',3],['elite',2]]) {
    const sectors = rewardSectors(tier)
    assert.equal(sectors.filter((s) => !s.code).length, misses)
    for (const sector of sectors) {
      const result = sectorResult(sector)
      if (result.voucher) assert.ok(result.voucher.tiers.includes(tier))
    }
    const counts = Array(6).fill(0)
    for (let i = 0; i < 6000; i++) counts[pickSector(() => (i + .5) / 6000)]++
    assert.deepEqual(counts, [1000,1000,1000,1000,1000,1000])
    assert.equal(pickSector(() => 0), 0)
    assert.equal(pickSector(() => 1 - Number.EPSILON), 5)
    assert.throws(() => pickSector(() => 1), RangeError)
  }
})
