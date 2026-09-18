import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { StoreDb } from '../src/db.js'
import { buildSupportKnowledge } from '../src/knowledge.js'

test('follow-up product lookup uses prior entity hint and normalized đ/stop words', () => {
  const result = buildSupportKnowledge('Cái đó giá bao nhiêu?', { productHints: ['3'] })
  assert.equal(result.matchedProducts.length, 1)
  assert.equal(result.matchedProducts[0].name, 'Đồng hồ Minimal')
})

test('fresh database does not seed demo orders unless explicitly enabled and dataMode is exact', () => {
  const directory = mkdtempSync(join(tmpdir(), 'store-data-mode-'))
  try {
    const db = new StoreDb(join(directory, 'none.sqlite'))
    assert.equal(db.calculateRevenue({ from: '2026-01-01', to: '2026-12-31' }).dataMode, 'none')
    db.insertOrder({ id: 'REAL-1', businessDate: '2026-09-01', status: 'paid', totalAmount: 100, isDemo: false })
    assert.equal(db.calculateRevenue({ from: '2026-01-01', to: '2026-12-31' }).dataMode, 'real')
    db.insertOrder({ id: 'DEMO-X', businessDate: '2026-09-02', status: 'paid', totalAmount: 100, isDemo: true })
    assert.equal(db.calculateRevenue({ from: '2026-01-01', to: '2026-12-31' }).dataMode, 'mixed')
    db.close()
    const demo = new StoreDb(join(directory, 'demo.sqlite'), { seedDemoData: true })
    assert.equal(demo.calculateRevenue({ from: '2026-01-01', to: '2026-12-31' }).dataMode, 'demo')
    demo.close()
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
