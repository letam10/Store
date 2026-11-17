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

// Vòng 3 (làm lại từ đầu): rail chỉ còn thẻ banner sản phẩm mới
// (.side-banner-card), chia hai đoạn độc lập — đoạn trước sale neo trong
// vùng intro, đoạn sau sale neo trong vùng catalog sau mục sale; region
// trang không render rail nữa; không còn thẻ hero/offer cũ, không khe sale.
function assertHomeRegion(window) {
  const { document, Node } = window
  const region = document.querySelector('.home-promotion-region--page')
  const intro = document.querySelector('.home-promotion-region--intro')
  const catalog = document.querySelector('.home-promotion-region--catalog')
  const sale = document.querySelector('#home-sale-products')
  assert.ok(region, 'Trang chủ cần frame banner toàn trang')
  assert.ok(intro, 'Trang chủ cần vùng intro')
  assert.ok(catalog, 'Banner còn lại cần được đưa xuống vùng danh mục')
  assert.ok(sale, 'Mục giảm giá cần đích điều hướng cố định')
  // Bốn rail: mỗi bên một đoạn trước sale (vùng intro) + một đoạn sau sale
  // (vùng catalog sau mục sale); region trang không render rail trực tiếp.
  assert.equal(document.querySelectorAll('aside.home-promotion-rail').length, 4)
  assert.equal(region.querySelectorAll(':scope > aside.home-promotion-rail').length, 0)
  assert.equal(intro.querySelectorAll('aside.home-promotion-rail').length, 2)
  assert.equal(catalog.querySelectorAll('.home-promotion-region__after aside.home-promotion-rail').length, 2)
  assert.ok(region.querySelector('.home-promotion-region__body .shop-hero'))
  assert.ok(region.querySelector('.home-promotion-region__body .store-promo-board'))
  assert.equal(intro.contains(sale), false)
  assert.equal(catalog.contains(sale), true)
  // Không còn thẻ hero/offer cũ hay khe sale trong rail.
  assert.equal(document.querySelectorAll('.home-side-banner').length, 0)
  assert.equal(document.querySelectorAll('.home-promotion-rail__sale-gap').length, 0)
  for (const side of ['left', 'right']) {
    const before = intro.querySelectorAll('.home-promotion-rail--' + side + ' .side-banner-card')
    const after = catalog.querySelectorAll('.home-promotion-region__after .home-promotion-rail--' + side + ' .side-banner-card')
    // Mặc định mỗi bên 5 banner, chia 2 trước/3 sau sale.
    assert.equal(before.length, 2, side + ': đoạn trước sale phải có 2 thẻ')
    assert.equal(after.length, 3, side + ': đoạn sau sale phải có 3 thẻ')
    const cards = [...before, ...after]
    assert.equal(new Set(cards.map(card => card.dataset.bannerId)).size, cards.length)
    for (const card of cards) {
      assert.equal(card.tagName, 'A', 'Cả banner cần là một liên kết')
      assert.match(card.getAttribute('href'), /^\/products\/.+/, 'Banner phải mở trang chi tiết sản phẩm')
      assert.equal(card.querySelector('a, button'), null, 'Banner không được chứa liên kết hoặc nút lồng nhau')
      assert.ok(card.querySelector('.side-banner-card__media img'), 'Banner cần ảnh sản phẩm')
      assert.ok(card.querySelector('.side-banner-card__name'), 'Banner cần tên sản phẩm')
      assert.ok(card.querySelector('.side-banner-card__price'), 'Banner cần giá sản phẩm')
    }
  }
  assert.ok(region.contains(sale) || region.compareDocumentPosition(sale) & Node.DOCUMENT_POSITION_FOLLOWING)
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

test('banner mặc định lấy sản phẩm giảm giá còn hàng, bỏ sản phẩm hết hàng', async () => {
  const offers = [saleProduct, { ...saleProduct, id: 'sold-out', discountPercent: 91, stockCount: 0 }]
  const dom = await openStore({ offers, customer: account })
  const { window } = dom
  try {
    const rails = () => [...window.document.querySelectorAll('.home-promotion-rail')]
    await waitFor(() => rails().length === 4)
    await waitFor(() => window.document.querySelector('a.side-banner-card[href="/products/banner-sale"]'))
    // Sản phẩm giảm giá còn hàng có mặt trong rail; sản phẩm hết hàng
    // (giảm 91%) không được chọn làm banner mặc định.
    assert.equal(window.document.querySelectorAll('a.side-banner-card[href="/products/sold-out"]').length, 0)
    assert.doesNotMatch(rails().map(rail => rail.textContent).join(' '), /91\s*%/)
    // Mọi banner đều là thẻ sản phẩm mới, link tới trang chi tiết thật.
    const links = [...window.document.querySelectorAll('a.side-banner-card')]
    assert.equal(links.length, 10)
    for (const link of links) {
      assert.match(link.getAttribute('href'), /^\/products\/.+/)
    }
    // Bấm banner sản phẩm giảm giá mở đúng trang chi tiết của nó.
    window.document.querySelector('a.side-banner-card[href="/products/banner-sale"]').click()
    await waitFor(() => window.location.pathname === '/products/banner-sale' && window.document.querySelector('.product-detail-layout'))
    assert.match(window.document.querySelector('.product-detail-layout').textContent, /Món giảm giá còn hàng/)
    assert.equal(window.document.querySelector('.home-promotion-rail'), null)
  } finally {
    window.close()
  }
})

test('bấm banner sản phẩm mở trang chi tiết của đúng sản phẩm đó', async () => {
  const dom = await openStore()
  const { window } = dom
  try {
    await waitFor(() => window.document.querySelector('a.side-banner-card'))
    const card = window.document.querySelector('.home-promotion-region--intro a.side-banner-card')
    const href = card.getAttribute('href')
    const name = card.querySelector('.side-banner-card__name').textContent
    card.click()
    await waitFor(() => window.location.pathname === href && window.document.querySelector('.product-detail-layout'))
    assert.match(window.document.querySelector('.product-detail-layout').textContent, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  } finally {
    window.close()
  }
})

test('khách không có hàng giảm giá không nhận mức giảm hàng hóa hoặc mã voucher giả', async () => {
  const dom = await openStore({ offers: [], vouchers: wallet })
  const { window } = dom
  try {
    const rails = () => [...window.document.querySelectorAll('.home-promotion-rail')]
    await waitFor(() => rails().length === 4 && window.document.querySelector('.home-empty-sale'))
    // Rail chỉ còn thẻ sản phẩm mới: không số % giảm giá, không mã voucher.
    for (const rail of rails()) {
      assert.doesNotMatch(rail.textContent, /\d\s*%/)
      for (const voucher of wallet) assert.equal(rail.textContent.includes(voucher.code), false)
    }
    assert.equal(window.document.querySelectorAll('a.side-banner-card').length, 10)
    assert.equal(window.document.querySelector('.store-gift-ticket'), null)
    assert.equal(window.document.querySelector('.store-sale-stamp'), null)
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
