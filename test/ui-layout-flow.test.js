import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
const bundle = await build({
  entryPoints: ['src/main.jsx'], bundle: true, platform: 'browser', format: 'iife', write: false,
  jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})

// Chức năng waitFor: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
async function waitFor(predicate) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.fail('UI did not reach the expected state')
}

// Chức năng response: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function response(status, data) { return { ok: status >= 200 && status < 300, status, json: async () => data } }

test('giỏ hàng hiển thị ba gợi ý có ảnh, tên, giá và chuyển theo từng nhóm', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/cart', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  const items = Array.from({ length: 26 }, (_, index) => ({ id: 'qa-suggestion-' + (index + 1), name: 'Sản phẩm thử ' + index, category: 'Nhóm thử', price: 100000 + index * 1000, discountPercent: 0, stockCount: 20, image: '/products/bag.svg' }))
  window.localStorage.setItem('storeCartV1', JSON.stringify([{ ...items[0], quantity: 1, selected: false }]))
  window.scrollTo = () => {}
  window.fetch = async (url) => String(url).includes('/customer/session') ? response(401, {}) :
    String(url).includes('/catalog') ? response(200, { products: items }) : response(200, { reviews: [] })
  window.eval(bundle.outputFiles[0].text)
  const activeProducts = () => [...window.document.querySelectorAll('.cart-similar__products[aria-hidden="false"] .cart-similar__product')]
  try {
    await waitFor(() => window.document.querySelector('.cart-item__body h3')?.textContent === items[0].name && Boolean(window.document.querySelector('.cart-similar__toggle:not(:disabled)')))
    window.document.querySelector('.cart-similar__toggle').click()
    await waitFor(() => activeProducts().length === 3)
    assert.match(window.document.querySelector('.cart-similar__head').textContent, /1–3 \/ 20/)
    const firstIds = activeProducts().map((link) => link.getAttribute('href'))
    for (const link of activeProducts()) {
      const expected = items.find((item) => '/products/' + item.id === link.getAttribute('href'))
      assert.equal(link.children.length, 3)
      assert.ok(link.querySelector('img'))
      assert.equal(link.querySelector('.cart-similar__product-name').textContent, expected.name)
      assert.equal(link.querySelector('.cart-similar__product-price strong').textContent, new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expected.price))
    }
    window.document.querySelector('[aria-label="Sản phẩm gợi ý tiếp theo"]').click()
    await waitFor(() => /4–6 \/ 20/.test(window.document.querySelector('.cart-similar__toolbar').textContent))
    assert.ok(activeProducts().every((link) => !firstIds.includes(link.getAttribute('href'))))
    assert.equal(window.document.querySelectorAll('.cart-similar__products[aria-hidden="false"]').length, 1)
    assert.ok([...window.document.querySelectorAll('.cart-similar__products[aria-hidden="true"]')].every((group) => group.hasAttribute('inert')))
    const range = window.document.querySelector('.cart-similar__range')
    const setRange = (value) => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(range, value)
      range.dispatchEvent(new window.Event('input', { bubbles: true }))
    }
    setRange(range.max)
    await waitFor(() => /19–20 \/ 20/.test(window.document.querySelector('.cart-similar__toolbar').textContent))
    assert.equal(activeProducts().length, 2)
    assert.equal(window.document.querySelector('[aria-label="Sản phẩm gợi ý tiếp theo"]').disabled, true)
    window.document.querySelector('[aria-label="Sản phẩm gợi ý trước"]').click()
    await waitFor(() => /16–18 \/ 20/.test(window.document.querySelector('.cart-similar__toolbar').textContent))
    setRange('0')
    await waitFor(() => /1–3 \/ 20/.test(window.document.querySelector('.cart-similar__toolbar').textContent))
    const viewport = window.document.querySelector('.cart-similar__viewport')
    for (const [type, clientX] of [['pointerdown', 100], ['pointermove', 30], ['pointerup', 30]]) viewport.dispatchEvent(new window.MouseEvent(type, { bubbles: true, clientX, clientY: 20, button: 0 }))
    await waitFor(() => /4–6 \/ 20/.test(window.document.querySelector('.cart-similar__toolbar').textContent))
    const thumb = activeProducts()[0]
    thumb.click()
    assert.equal(window.location.pathname, '/cart')
    const href = thumb.getAttribute('href')
    thumb.click()
    await waitFor(() => window.location.pathname === href)
    assert.ok(window.document.querySelector('.product-detail-page'))
  } finally { window.close() }
})

test('lọc số sao, nội dung và sắp xếp đánh giá giữ nguyên thống kê tổng', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/products/1', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  const reviews = [
    { id: 1, username: 'Bốn sao', rating: 4, comment: '', createdAt: '2026-10-01T10:00:00Z' },
    { id: 2, username: 'Năm sao', rating: 5, comment: 'Rất tốt', createdAt: '2026-10-02T10:00:00Z' },
    { id: 3, username: 'Một sao', rating: 1, comment: 'Cần cải thiện', adminReply: 'Store đã tiếp nhận', createdAt: '2026-10-03T10:00:00Z' },
  ]
  window.scrollTo = () => {}
  window.fetch = async (url) => String(url).includes('/customer/session') ? response(401, {}) :
    String(url).includes('/reviews') ? response(200, { reviews }) : response(200, { products: [] })
  window.eval(bundle.outputFiles[0].text)
  const names = () => [...window.document.querySelectorAll('.detail-review-heading strong')].map((node) => node.textContent)
  const choose = (selector, value) => {
    const input = window.document.querySelector(selector)
    input.value = value
    input.dispatchEvent(new window.Event('change', { bubbles: true }))
  }
  try {
    await waitFor(() => names().length === 3)
    assert.deepEqual(names(), ['Một sao', 'Năm sao', 'Bốn sao'])
    assert.match(window.document.querySelector('.review-score-classification').textContent, /Khá/)
    choose('.review-sort select', 'highest')
    await waitFor(() => names()[0] === 'Năm sao')
    assert.deepEqual(names(), ['Năm sao', 'Bốn sao', 'Một sao'])
    choose('.review-sort select', 'lowest')
    await waitFor(() => names()[1] === 'Bốn sao')
    assert.deepEqual(names(), ['Một sao', 'Bốn sao', 'Năm sao'])
    choose('.review-sort select', 'oldest')
    await waitFor(() => names()[0] === 'Bốn sao')
    window.document.querySelector('[aria-label="Lọc 4 sao"]').click()
    await waitFor(() => names().length === 1)
    assert.deepEqual(names(), ['Bốn sao'])
    assert.match(window.document.querySelector('.detail-rating-summary > strong').textContent, /3.3/)
    assert.equal(window.document.querySelector('[aria-label="4 sao: 1 đánh giá"]').getAttribute('aria-valuenow'), '1')
    choose('#review-content-filter', 'replied')
    await waitFor(() => Boolean(window.document.querySelector('.review-filter-empty')))
    assert.equal(names().length, 0)
    window.document.querySelector('.review-filter-empty button').click()
    await waitFor(() => names().length === 3)
    choose('#review-content-filter', 'commented')
    await waitFor(() => names().length === 2)
    assert.deepEqual(names(), ['Năm sao', 'Một sao'])
    choose('#review-content-filter', 'replied')
    await waitFor(() => names().length === 1)
    assert.deepEqual(names(), ['Một sao'])
  } finally { window.close() }
})

test('catalog measures attached sticky elements and toggles the compact filter', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/products', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  const observed = []
  window.ResizeObserver = class { observe(element) { assert.ok(element instanceof window.Element); observed.push(element) } disconnect() {} }
  window.scrollTo = () => {}
  window.fetch = async (url) => String(url).includes('/customer/session') ? response(401, {}) : response(200, { products: [] })
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => observed.some((element) => element.classList.contains('catalog-sidebar')))
    const toggle = window.document.querySelector('.catalog-filter-toggle')
    toggle.click()
    await waitFor(() => toggle.getAttribute('aria-expanded') === 'true')
    assert.ok(window.document.querySelector('.catalog-sidebar.is-open'))
    toggle.click()
    await waitFor(() => toggle.getAttribute('aria-expanded') === 'false')
  } finally { window.close() }
})

test('banner liên trang dùng dữ liệu ưu đãi thật và chọn đúng một mã cho từng loại', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  const account = { id: 71, username: 'khach-uu-dai', email: 'qa@example.com', tier: 'gold', points: 1500, spinCredits: 4, csrfToken: 'qa-promotion' }
  const wallet = [
    { code: 'QUAHANG1', type: 'amount', value: 100000, scope: 'goods', expiresAt: '2999-01-01T00:00:00Z' },
    { code: 'QUAHANG2', type: 'percent', value: 20, scope: 'goods', expiresAt: '2999-01-01T00:00:00Z' },
    { code: 'QUASHIP', type: 'percent', value: 100, scope: 'shipping', expiresAt: '2999-01-01T00:00:00Z' },
    { code: 'HETHAN', type: 'percent', value: 100, scope: 'shipping', expiresAt: '2000-01-01T00:00:00Z' },
  ]
  window.fetch = async url => {
    const path = String(url)
    if (path.includes('/customer/session')) return response(200, { account })
    if (path.includes('/customer/vouchers')) return response(200, { vouchers: wallet })
    if (path.includes('/customer/orders')) return response(200, { orders: [] })
    if (path.includes('/customer/favorites')) return response(200, { ids: ['qa-promo-sale'] })
    if (path.includes('/catalog')) return response(200, { products: [
      { id: 'qa-promo-sale', name: 'Món yêu thích đang giảm', price: 200000, category: 'Đồ gia dụng', image: '/products/cup.svg', stockCount: 5, discountPercent: 30 },
      { id: 'qa-promo-sold', name: 'Ưu đãi đã hết kho', price: 200000, category: 'Đồ gia dụng', stockCount: 0, discountPercent: 90 },
    ] })
    return response(200, {})
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('[aria-label="Chọn mã QUAHANG1"]')))
    const board = () => window.document.querySelector('.store-promo-board')
    const clickCode = code => window.document.querySelector('[aria-label="Chọn mã ' + code + '"]').click()
    assert.equal(board().textContent.includes('HETHAN'), false)
    assert.match(window.document.querySelector('.store-promo-notice').textContent, /30%/)
    assert.match(board().querySelector('.store-member-offer').textContent, /Hạng Vàng.*2\s*%/s)
    assert.match(board().querySelector('.store-member-offer__progress').textContent, /8.500/)
    assert.equal(board().textContent.includes('Ưu đãi đã hết kho'), false)
    clickCode('QUAHANG1')
    await waitFor(() => board().querySelectorAll('.store-gift-ticket.is-selected').length === 1)
    clickCode('QUASHIP')
    await waitFor(() => board().querySelectorAll('.store-gift-ticket.is-selected').length === 2)
    clickCode('QUAHANG2')
    await waitFor(() => board().querySelector('[aria-label="Bỏ chọn mã QUAHANG2"]'))
    assert.deepEqual([...board().querySelectorAll('.store-gift-ticket.is-selected code')].map(node => node.textContent), ['QUAHANG2', 'QUASHIP'])
    for (const path of ['/products', '/favorites', '/rewards', '/membership', '/contact', '/account']) {
      window.document.querySelector('.header-nav a[href="' + path + '"]')?.click()
      if (path === '/account') window.document.querySelector('.header-inner a[href="/account"]').click()
      const excluded = ['/favorites', '/rewards', '/membership', '/contact'].includes(path)
      await waitFor(() => window.location.pathname === path && Boolean(board()) === !excluded)
      assert.equal(window.document.querySelectorAll('.home-promotion-rail').length, 0)
      assert.equal(window.document.querySelector('.home-promotion-region'), null)
      if (excluded) assert.equal(window.document.querySelector('.store-promo-notice'), null)
      else assert.match(board().textContent, /QUAHANG1/)
    }
    window.document.querySelector('.store-promo-product').click()
    await waitFor(() => window.location.pathname === '/products/qa-promo-sale')
    assert.match(window.document.querySelector('h1').textContent, /Món yêu thích đang giảm/)
    assert.equal(window.document.querySelector('.store-promo-layout'), null)
  } finally { window.close() }
})

test('checkout ghép VietQR của main với biên nhận và chỉ gửi mô phỏng một lần', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/checkout', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  const account = { id: 82, username: 'qa-checkout', tier: 'bronze', points: 0, spinCredits: 0, csrfToken: 'qa-merge-checkout' }
  const order = { id: 'ST-MERGE-TEST', total: 420000, extraPaid: 0, refundAmount: 0, recipient: 'Khách thử', phone: '0901234567', address: 'Địa chỉ thử', fulfillment: 'delivery', deliveryStatus: 'processing', paymentMethod: 'bank_transfer', paymentMode: 'demo', scheduledAt: '2999-01-01T00:00:00Z', status: 'pending' }
  let payments = 0, submitted = null
  window.localStorage.setItem('storeCartV1', JSON.stringify([{ id: 1, quantity: 1, selected: true }]))
  window.fetch = async (url, options = {}) => {
    const path = String(url)
    if (path.endsWith('/customer/session')) return response(200, { account })
    if (path.endsWith('/customer/payment-sessions') && options.method === 'POST') {
      submitted = JSON.parse(options.body)
      return response(201, {
        sessionId: order.id,
        expiresAt: new Date(Date.now() + 120000).toISOString(),
        order,
        payment: {
          mode: 'demo', amount: order.total, reference: order.id, bankName: 'Ngân hàng thử',
          accountNumber: '0000000000', accountName: 'STORE TEST', qrImage: '/products/cup.svg',
        },
      })
    }
    if (path.endsWith('/customer/orders')) return response(200, { orders: payments ? [order] : [] })
    if (path.endsWith('/customer/quote')) return response(200, { subtotal: 390000, goodsTotal: 390000, shippingFee: 30000, total: order.total })
    if (path.endsWith('/customer/vouchers')) return response(200, { vouchers: [] })
    if (path.endsWith('/customer/favorites')) return response(200, { ids: [] })
    if (path.endsWith('/catalog')) return response(200, { products: [] })
    if (path.endsWith('/receipt')) return response(200, { order, afterSales: [], events: [] })
    if (path.endsWith('/payment-info')) return response(200, { order, payment: { mode: 'demo', amount: order.total, reference: order.id, bankName: 'Ngân hàng thử', accountNumber: '0000000000', accountName: 'STORE TEST', qrImage: '/products/cup.svg' } })
    if (path.endsWith('/simulate-pay')) {
      payments++
      await new Promise(resolve => setTimeout(resolve, 30))
      order.status = 'paid'
      return response(200, { success: true, order })
    }
    return response(200, {})
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => window.document.querySelector('.checkout-card button[type="submit"]')?.disabled === false)
    const form = window.document.querySelector('form.checkout-card')
    form.elements.phone.value = '0901234567'
    form.elements.address.value = 'Địa chỉ thử'
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => Boolean(window.document.querySelector('.bank-payment-qr img')))
    assert.equal(submitted.expectedTotal, 420000)
    assert.equal(submitted.paymentMethod, 'bank_transfer')
    assert.equal(window.document.querySelector('.bank-payment-qr img').getAttribute('src'), '/products/cup.svg')
    assert.match(window.document.querySelector('.bank-payment-card .commerce-facts').textContent, /Ngân hàng thử/)
    const pay = [...window.document.querySelectorAll('button')].find(button => button.textContent === 'Mô phỏng chuyển khoản thành công')
    pay.click(); pay.click()
    await waitFor(() => window.location.pathname === '/')
    assert.equal(payments, 1)
    assert.equal(window.document.querySelector('.bank-payment-card'), null)
    window.document.querySelector('.header-inner a[href="/account"]').click()
    await waitFor(() => window.document.querySelector('.commerce-row-head button'))
    window.document.querySelector('.commerce-row-head button').click()
    await waitFor(() => window.document.querySelector('.commerce-head')?.textContent.includes('Đã thanh toán'))
    assert.ok([...window.document.querySelectorAll('button')].some(button => button.textContent === 'In biên nhận / Lưu PDF'))
  } finally { window.close() }
})
