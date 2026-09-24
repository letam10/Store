import test from 'node:test'
import assert from 'node:assert/strict'
import { rewardSectors, pickSector, landingRotation, sectorAtPointer, sectorResult } from '../src/storefront/rewardWheel.js'

test('server prize index lands at the pointer over repeated spins', () => {
  let rotation = 0
  const sectors = rewardSectors()
  for (let turn = 0; turn < 100; turn++) {
    const sector = sectors[turn % sectors.length]
    const next = landingRotation(rotation, sector.id, sectors.length)
    assert.ok(next - rotation >= 2160)
    assert.equal(sectorAtPointer(next, sectors.length), sector.id)
    const voucher = sector.kind === 'none' ? null : { code: 'ABCDEFGHIJ', label: sector.short }
    const result = sectorResult(sector, voucher)
    assert.equal(result.sectorId, sectorAtPointer(next, sectors.length))
    assert.equal(result.voucher?.code || null, voucher?.code || null)
    rotation = next
  }
})

test('ten visible sectors represent only three prize kinds and remain hidden odds', () => {
  const sectors = rewardSectors()
  assert.equal(sectors.length, 10)
  assert.deepEqual(sectors.reduce((counts, sector) => ({ ...counts, [sector.kind]: (counts[sector.kind] || 0) + 1 }), {}),
    { none: 6, amount: 3, percent: 1 })
  const counts = Array(10).fill(0)
  for (let i = 0; i < 10000; i++) counts[pickSector(() => (i + .5) / 10000)]++
  assert.deepEqual(counts, Array(10).fill(1000))
  assert.throws(() => pickSector(() => 1), RangeError)
})
