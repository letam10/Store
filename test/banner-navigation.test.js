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

// Vòng 3 (làm lại từ đầu): thẻ hero cũ neo tới #home-sale-products không
// còn trong rail, nên test này kiểm tra hành vi mới tương đương — bấm banner
// sản phẩm mở đúng trang chi tiết, và điều hướng cuộn về đầu trang thay vì
// khôi phục vị trí cuộn cũ của trang chủ.
test('bấm banner sản phẩm mở trang chi tiết và điều hướng cuộn về đầu trang', async () => {
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
    await waitFor(() => window.document.querySelector('a.side-banner-card'))
    // Mục giảm giá vẫn còn là một section trên trang chủ (chỉ không còn
    // thẻ hero nào trong rail neo tới nó nữa).
    assert.ok(window.document.querySelector('#home-sale-products'))
    const card = window.document.querySelector('.home-promotion-region--intro a.side-banner-card')
    const href = card.getAttribute('href')
    const name = card.querySelector('.side-banner-card__name').textContent
    window.scrollY = 320
    card.click()
    await waitFor(() => window.location.pathname === href && window.document.querySelector('.product-detail-layout'))
    assert.match(window.document.querySelector('.product-detail-layout').textContent, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    // Điều hướng push cuộn về đầu trang (hai animation frame của App).
    await new Promise(resolve => setTimeout(resolve, 80))
    assert.ok(restoredPositions.length > 0, 'điều hướng phải cuộn trang')
    assert.equal(restoredPositions.at(-1).top, 0)
    window.document.querySelector('.header-nav a[href="/products"]').click()
    await waitFor(() => window.location.pathname === '/products')
    await new Promise(resolve => setTimeout(resolve, 80))
    assert.equal(restoredPositions.at(-1).top, 0)
  } finally {
    window.close()
  }
})
