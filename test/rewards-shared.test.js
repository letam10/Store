import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'
import { resolve } from 'node:path'
import { buildSync } from 'esbuild'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'
import { rewardSectors, landingRotation, sectorAtPointer } from '../src/storefront/rewardWheel.js'

const filename = resolve('test/rewards-component.bundle.cjs')
const compiled = buildSync({ entryPoints: ['src/pages/Rewards.jsx'], bundle: true, write: false,
  platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', define: { 'import.meta.env': '{}' }, loader: { '.css': 'empty' } })
const component = new Module(filename)
component.filename = filename
component.paths = Module._nodeModulePaths(resolve('test'))
component._compile(compiled.outputFiles[0].text, filename)
const Rewards = component.exports.default

test('shipping wheel keeps server prize positions and points at the returned sector', () => {
  const sectors = rewardSectors('shipping')
  assert.deepEqual(sectors.map(item => item.kind === 'none'), rewardSectors().map(item => item.kind === 'none'))
  assert.equal(sectors.filter(item => item.short === '50%').length, 3)
  assert.equal(sectors[4].short, 'Miễn ship')
  let rotation = 0
  for (let round = 0; round < 30; round++) for (const sector of sectors) {
    rotation = landingRotation(rotation, sector.id, sectors.length)
    assert.equal(sectorAtPointer(rotation, sectors.length), sector.id)
  }
})

test('two visible wheels share the request lock and remaining balance', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/rewards' })
  dom.window.matchMedia = () => ({ matches: true })
  const requests = []
  const pending = []
  const replacements = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: (url, options) => { requests.push({ url, ...JSON.parse(options.body) }); return new Promise(resolve => pending.push(resolve)) } }
  const originals = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('root'))
  const account = { id: 7, username: 'test-buyer', csrfToken: 'test-only', spinCredits: 2 }
  const respond = async (wheel, credits, index, voucher) => {
    await act(async () => {
      pending.shift()(new Response(JSON.stringify({ wheel, spinCredits: credits, index, voucher }), { headers: { 'content-type': 'application/json' } }))
      await new Promise(resolve => setTimeout(resolve, 15))
    })
  }
  try {
    await act(async () => root.render(React.createElement(Rewards, { account, onReward: () => {} })))
    assert.equal(document.querySelectorAll('.lucky-wheel').length, 2)
    await act(async () => { document.querySelectorAll('.lucky-spin')[0].click(); document.querySelectorAll('.lucky-spin')[1].click() })
    assert.equal(requests.length, 1)
    assert.equal(requests[0].wheel, 'goods')
    assert.ok([...document.querySelectorAll('.lucky-spin')].every(button => button.disabled))
    await respond('goods', 1, 0, null)
    assert.match(document.querySelector('.shared-spin-balance').textContent, /1 lượt/)
    await act(async () => document.querySelector('.reward-modal__close').click())
    await act(async () => document.querySelectorAll('.lucky-spin')[1].click())
    assert.equal(requests.length, 2)
    assert.equal(requests[1].wheel, 'shipping')
    await respond('shipping', 0, 4, { label: 'Voucher miễn phí ship', scope: 'shipping', type: 'percent', value: 100, code: 'TESTSHIP22', expiresAt: '2026-11-01T00:00:00Z' })
    assert.match(document.querySelector('.reward-modal').textContent, /miễn phí ship/)
    assert.equal(document.querySelector('.reward-modal').dataset.sector, '4')
    await act(async () => document.querySelector('.reward-modal__close').click())
    assert.match(document.querySelector('.shared-spin-balance').textContent, /0 lượt/)
    assert.ok([...document.querySelectorAll('.lucky-spin')].every(button => button.disabled))
  } finally {
    await act(async () => root.unmount()); dom.window.close()
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
  }
})
