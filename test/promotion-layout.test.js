import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { products } from '../src/data/products.js'

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

const account = {
  id: 71,
  username: 'khach-banner',
  email: 'banner@example.com',
  tier: 'gold',
  points: 1500,
  spinCredits: 4,
  csrfToken: 'banner-test',
}
const saleProduct = {
  id: 'banner-sale',
  name: 'Món giảm giá còn hàng',
  category: 'Đồ gia dụng',
  price: 200000,
  image: '/products/cup.svg',
  stockCount: 5,
  discountPercent: 37,
}
const wallet = [
  { code: 'HANG1', scope: 'goods', type: 'amount', value: 100000, expiresAt: '2999-01-01T00:00:00Z' },
  { code: 'HANG2', scope: 'goods', type: 'percent', value: 20, expiresAt: '2999-01-01T00:00:00Z' },
  { code: 'SHIP', scope: 'shipping', type: 'percent', value: 100, expiresAt: '2999-01-01T00:00:00Z' },
  { code: 'HETHAN', scope: 'goods', type: 'percent', value: 99, expiresAt: '2000-01-01T00:00:00Z' },
]

async function waitFor(predicate, message = 'Giao diện chưa đạt trạng thái mong đợi') {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  assert.fail(message)
}

function response(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data }
}

async function openStore({ customer = null, offers = [saleProduct], vouchers = [] } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  })
  const { window } = dom
  // Ghi đè mức giảm của catalog nền để dữ liệu thử không lẫn ưu đãi demo.
  const catalog = products.map(product => ({ id: product.id, discountPercent: 0, stockCount: 20 }))
  window.scrollTo = () => {}
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  window.HTMLElement.prototype.scrollIntoView = () => {}
  window.fetch = async url => {
    const path = String(url)
    if (path.includes('/customer/session')) return response(customer ? 200 : 401, { account: customer })
    if (path.includes('/customer/orders')) return response(200, { orders: [] })
    if (path.includes('/customer/vouchers')) return response(200, { vouchers })
    if (path.includes('/customer/favorites')) return response(200, { ids: [saleProduct.id] })
    if (path.includes('/catalog')) return response(200, { products: [...catalog, ...offers] })
    if (path.includes('/reviews')) return response(200, { reviews: [] })
    return response(200, {})
  }
  window.eval(bundle.outputFiles[0].text)
  return dom
}

function assertHomeRegion(window) {
  const { document, Node } = window
  const region = document.querySelector('.home-promotion-region')
  const sale = document.querySelector('#home-sale-products')
  assert.ok(region, 'Trang chủ cần vùng giới hạn banner')
  assert.ok(sale, 'Mục giảm giá cần đích điều hướng cố định')
  assert.equal(document.querySelectorAll('.home-promotion-rail').length, 2)
  assert.equal(region.querySelectorAll('aside.home-promotion-rail').length, 2)
  for (const side of ['left', 'right']) {
    assert.ok(region.querySelector('.home-promotion-rail--' + side + ' .home-side-banner'))
  }
  assert.ok(region.querySelector('.home-promotion-region__body .shop-hero'))
  assert.ok(region.querySelector('.home-promotion-region__body .store-promo-board'))
  assert.equal(region.contains(sale), false)
  assert.ok(region.compareDocumentPosition(sale) & Node.DOCUMENT_POSITION_FOLLOWING)
  assert.equal(document.querySelectorAll('.store-promo-rail').length, 0)
}

async function navigate(window, path, selector) {
  const link = window.document.querySelector('.site-header a[href="' + path + '"]')
  assert.ok(link, 'Thiếu liên kết điều hướng ' + path)
  link.click()
  await waitFor(() => window.location.pathname === path && window.document.querySelector(selector), path)
}

const publicRoutes = [
  ['/products', '.catalog-results'],
  ['/rewards', '.lucky-wheel'],
  ['/contact', '.contact-page'],
  ['/cart', '.empty-panel'],
]
const memberRoutes = [
  ['/favorites', '.favorites-grid'],
  ['/membership', '.membership-hero'],
  ['/account', '.account-profile'],
]

for (const customer of [null, account]) {
  test('hai banner chỉ ở trang chủ khi điều hướng với ' + (customer ? 'thành viên' : 'khách'), async () => {
    const dom = await openStore({ customer })
    const { window } = dom
    try {
      await waitFor(() => window.document.querySelector('.home-promotion-region'))
      if (customer) await waitFor(() => window.document.querySelector('.account-link')?.textContent.includes('khach'))
      assertHomeRegion(window)
      for (const [path, selector] of customer ? [...publicRoutes, ...memberRoutes] : publicRoutes) {
        await navigate(window, path, selector)
        assert.equal(window.document.querySelectorAll('.home-promotion-rail, .store-promo-rail').length, 0)
        assert.equal(window.document.querySelector('.home-promotion-region'), null)
        await navigate(window, '/', '.home-promotion-region')
        assertHomeRegion(window)
      }
    } finally {
      window.close()
    }
  })
}

test('banner lấy mức giảm lớn nhất còn hàng và giữ liên kết có đích thật', async () => {
  const offers = [saleProduct, { ...saleProduct, id: 'sold-out', discountPercent: 91, stockCount: 0 }]
  const dom = await openStore({ offers, customer: account })
  const { window } = dom
  try {
    const left = () => window.document.querySelector('.home-promotion-rail--left')
    const right = () => window.document.querySelector('.home-promotion-rail--right')
    await waitFor(() => /37\s*%/.test(left()?.textContent || ''))
    assert.doesNotMatch(left().textContent, /91\s*%/)
    await waitFor(() => /Vàng/.test(right()?.textContent || ''))
    assert.match(right().textContent, /2\s*%/)
    assert.ok(right().querySelector('a[href="/membership"]'))
    assert.ok(right().querySelector('a[href="/rewards"]'))
    const links = [...window.document.querySelectorAll('.home-side-banner a')]
    assert.ok(links.length >= 3)
    for (const link of links) {
      const href = link.getAttribute('href')
      assert.ok(href === '#home-sale-products' || /^\/(products|membership|rewards)(\?|$)/.test(href))
      if (href.startsWith('#')) assert.ok(window.document.querySelector(href))
    }
    right().querySelector('a[href="/rewards"]').click()
    await waitFor(() => window.location.pathname === '/rewards' && window.document.querySelector('.lucky-wheel'))
    assert.equal(window.document.querySelector('.home-promotion-rail'), null)
  } finally {
    window.close()
  }
})

test('khách không có hàng giảm giá không nhận mức giảm hàng hóa hoặc mã voucher giả', async () => {
  const dom = await openStore({ offers: [], vouchers: wallet })
  const { window } = dom
  try {
    const left = () => window.document.querySelector('.home-promotion-rail--left')
    await waitFor(() => left() && window.document.querySelector('.home-empty-sale'))
    assert.doesNotMatch(left().textContent, /\d\s*%/)
    assert.equal(window.document.querySelector('.store-gift-ticket'), null)
    assert.equal(window.document.querySelector('.store-sale-stamp'), null)
    const right = window.document.querySelector('.home-promotion-rail--right')
    assert.match(right.textContent, /Kim Cương/)
    assert.match(right.textContent, /10[.\s]?000/)
    assert.match(right.textContent, /5\s*%/)
    assert.ok(right.querySelector('a[href="/membership"]'))
    for (const voucher of wallet) assert.equal(right.textContent.includes(voucher.code), false)
  } finally {
    window.close()
  }
})

test('di chuyển banner vẫn giữ chọn một mã hàng hóa cùng một mã ship qua điều hướng', async () => {
  const dom = await openStore({ customer: account, vouchers: wallet })
  const { window } = dom
  const board = () => window.document.querySelector('.store-promo-board')
  const select = code => board().querySelector('[aria-label="Chọn mã ' + code + '"]').click()
  const selected = () => [...board().querySelectorAll('.is-selected code')].map(node => node.textContent)
  try {
    await waitFor(() => board()?.querySelector('[aria-label="Chọn mã HANG1"]'))
    assert.equal(board().textContent.includes('HETHAN'), false)
    select('HANG1')
    await waitFor(() => selected().length === 1)
    select('SHIP')
    await waitFor(() => selected().length === 2)
    select('HANG2')
    await waitFor(() => selected().includes('HANG2'))
    assert.deepEqual(selected(), ['HANG2', 'SHIP'])
    await navigate(window, '/products', '.catalog-results')
    assert.deepEqual(selected(), ['HANG2', 'SHIP'])
    assert.equal(window.document.querySelector('.home-promotion-rail'), null)
    await navigate(window, '/', '.home-promotion-region')
    assertHomeRegion(window)
    assert.deepEqual(selected(), ['HANG2', 'SHIP'])
  } finally {
    window.close()
  }
})
