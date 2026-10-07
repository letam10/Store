import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const bundle = await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  write: false,
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})

async function waitFor(predicate) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.fail('Không đến được trạng thái giao diện cần kiểm tra')
}

test('neo banner tới khu giảm giá không bị khôi phục vị trí cuộn cũ', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  })
  const { window } = dom
  const restoredPositions = []
  window.scrollTo = value => restoredPositions.push(value)
  window.fetch = async url => {
    const session = String(url).endsWith('/api/customer/session')
    return {
      ok: !session,
      status: session ? 401 : 200,
      json: async () => session ? { error: 'LOGIN_REQUIRED' } : { products: [] },
    }
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => window.document.querySelector('.home-side-banner__action'))
    window.scrollY = 320
    window.document.querySelector('.home-side-banner--store .home-side-banner__action').click()
    await waitFor(() => window.location.hash === '#home-sale-products')
    // Chờ popstate và hai animation frame mà cơ chế khôi phục cuộn cũ từng sử dụng.
    await new Promise(resolve => setTimeout(resolve, 80))
    assert.equal(restoredPositions.length, 0)
    assert.ok(window.document.querySelector('#home-sale-products'))
    window.document.querySelector('.header-nav a[href="/products"]').click()
    await waitFor(() => window.location.pathname === '/products')
    await waitFor(() => restoredPositions.length > 0)
    assert.equal(restoredPositions.at(-1).top, 0)
  } finally {
    window.close()
  }
})
