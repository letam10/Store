/*
  FILE NOTE
  - Mục đích: Bộ kiểm thử luồng giao diện người dùng chính: duyệt hàng, bắt buộc đăng nhập khi thêm giỏ hàng, xác thực khách hàng và luồng điều hướng.
  - Liên kết trực tiếp: src/main.jsx, src/App.jsx, src/pages/Auth.jsx, src/pages/ProductDetail.jsx
  - Vùng ảnh hưởng khi sửa: Toàn bộ kiểm thử tự động xác nhận tính toàn vẹn của luồng UI và quyền truy cập người dùng.
*/
import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { pbkdf2Sync, webcrypto } from 'node:crypto'

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

// Kiểm thử edge case: khách có thể xem hàng nhưng thêm giỏ, thanh toán, yêu thích và chat đều yêu cầu đăng nhập.
test('guest can browse but cart, checkout, favorites and chat require login', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
  window.fetch = async (url) => {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (String(url).endsWith('/api/customer/session')) return response(401, { error: 'LOGIN_REQUIRED' })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (String(url).includes('/catalog')) return response(200, { products: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (String(url).includes('/reviews')) return response(200, { reviews: [] })
    return response(200, { viewCount: 1 })
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.shop-hero-art')))
    assert.ok(window.document.querySelector('.hero-product-frame'))
    assert.match(window.document.querySelector('.hero-art-caption')?.textContent || '', /TOP 20/)
    assert.equal(window.document.querySelector('.shop-hero-art')?.getAttribute('href'), '/products/1')
    window.document.querySelector('.shop-hero-art').click()
    await waitFor(() => window.location.pathname === '/products/1')
    assert.match(window.document.querySelector('h1').textContent, /Tai nghe Everyday/)
    window.document.querySelector('.product-detail-actions button').click()
    await waitFor(() => window.location.pathname === '/login' && Boolean(window.document.querySelector('.auth-panel')))
    assert.match(window.location.search, /next=%2Fproducts%2F1/)
    window.document.querySelector('.auth-back').click()
    await waitFor(() => window.location.pathname === '/')
    window.document.querySelector('a[href="/rewards"]').click()
    await waitFor(() => window.location.pathname === '/rewards' && Boolean(window.document.querySelector('.lucky-wheel')))
    window.document.querySelector('.lucky-spin').click()
    await waitFor(() => window.location.pathname === '/login' && Boolean(window.document.querySelector('.auth-panel')))
    window.document.querySelector('.auth-back').click()
    await waitFor(() => window.location.pathname === '/')
    window.document.querySelector('.product-favorite').click()
    await waitFor(() => window.location.pathname === '/login')
    assert.match(window.location.search, /next=/)
    window.document.querySelector('.auth-back').click()
    await waitFor(() => window.location.pathname === '/')
    window.document.querySelector('.customer-support__toggle').click()
    await waitFor(() => window.location.pathname === '/login')
  } finally { window.close() }
})

// Kiểm thử edge case: server-backed registration loads account without saving a browser password.
test('server-backed registration loads account without saving a browser password', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/register', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  let signedIn = false
  const account = { id: 1, username: 'demo-user', email: 'demo@example.com', points: 0, tier: 'bronze', spinCredits: 0, csrfToken: 'csrf-test' }
  window.fetch = async (url, options = {}) => {
    const path = String(url)
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/register')) { signedIn = true; return response(201, { account }) }
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/session')) return signedIn ? response(200, { authenticated: true, account }) : response(401, { error: 'LOGIN_REQUIRED' })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/orders')) return response(200, { orders: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/vouchers')) return response(200, { vouchers: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/favorites')) return response(200, { ids: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/logout')) { signedIn = false; return response(200, { ok: true }) }
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/login')) { signedIn = true; return response(200, { account }) }
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/catalog')) return response(200, { products: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (options.method === 'POST') return response(200, {})
    return response(200, {})
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.auth-panel form')))
    const register = window.document.querySelector('.auth-panel form')
    register.elements.username.value = 'demo-user'
    register.elements.email.value = 'demo@example.com'
    register.elements.password.value = 'demo-password-123'
    register.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => window.location.pathname === '/account' && Boolean(window.document.querySelector('.account-profile')))
    assert.equal(window.localStorage.getItem('storeDemoUsersV1'), null)
    assert.match(window.document.querySelector('.account-profile').textContent, /demo-user/)
    window.document.querySelector('.account-logout button').click()
    await waitFor(() => Boolean(window.document.querySelector('.auth-panel form')))
    const login = window.document.querySelector('.auth-panel form')
    login.elements.username.value = 'demo-user'
    login.elements.password.value = 'demo-password-123'
    login.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => Boolean(window.document.querySelector('.account-profile')))
  } finally { window.close() }
})

// Kiểm thử edge case: old browser demo credentials migrate only after password verification.
test('old browser demo credentials migrate only after password verification', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/login', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  window.TextEncoder = TextEncoder
  Object.defineProperty(window.crypto, 'subtle', { value: webcrypto.subtle })
  const salt = '0123456789abcdef0123456789abcdef'
  window.localStorage.setItem('storeDemoUsersV1', JSON.stringify([{ username: 'old-user', email: 'old@example.com', salt,
    hash: pbkdf2Sync('old-password', Buffer.from(salt, 'hex'), 120000, 32, 'sha256').toString('hex') }]))
  let registered = 0
  const account = { id: 2, username: 'old-user', email: 'old@example.com', points: 0, tier: 'bronze', spinCredits: 0, csrfToken: 'csrf-old' }
  window.fetch = async (url) => {
    const path = String(url)
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/login')) return response(401, { error: 'INVALID_CREDENTIALS' })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/register')) { registered += 1; return response(201, { account }) }
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/session')) return response(registered ? 200 : 401, registered ? { authenticated: true, account } : { error: 'LOGIN_REQUIRED' })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/orders')) return response(200, { orders: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/vouchers')) return response(200, { vouchers: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/customer/favorites')) return response(200, { ids: [] })
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (path.includes('/catalog')) return response(200, { products: [] })
    return response(200, {})
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.auth-panel form')))
    const login = window.document.querySelector('.auth-panel form')
    login.elements.username.value = 'old-user'
    login.elements.password.value = 'old-password'
    login.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => window.location.pathname === '/account' && Boolean(window.document.querySelector('.account-profile')))
    assert.equal(registered, 1)
    assert.ok(window.localStorage.getItem('storeDemoUsersV1'))
  } finally { window.close() }
})

// Kiểm thử edge case: out-of-stock cart item is dimmed, cannot be selected and shows similar goods.
test('out-of-stock cart item is dimmed, cannot be selected and shows similar goods', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/cart', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.localStorage.setItem('storeCartV1', JSON.stringify([{ id: 1, name: 'Tai nghe Everyday', price: 890000, quantity: 1, selected: true }]))
  window.scrollTo = () => {}
  window.fetch = async (url) => String(url).includes('/customer/session') ? response(401, { error: 'LOGIN_REQUIRED' }) :
    String(url).includes('/catalog') ? response(200, { products: [{ id: '1', discountPercent: 0, stockCount: 0, viewCount: 0 }] }) : response(200, {})
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.cart-item--out')))
    assert.match(window.document.querySelector('.cart-item--out').textContent, /Hết hàng/)
    assert.equal(window.document.querySelector('.cart-select input').disabled, true)
    assert.equal(window.document.querySelector('a[href="/checkout"]'), null)
    const similarToggle = window.document.querySelector('.cart-similar__toggle')
    assert.ok(similarToggle)
    if (similarToggle.disabled) {
      assert.match(window.document.querySelector('.cart-similar').textContent, /Chưa có sản phẩm cùng danh mục/)
    } else {
      similarToggle.click()
      await waitFor(() => Boolean(window.document.querySelector('.cart-similar__product')))
      assert.ok(window.document.querySelector('.cart-similar__product').getAttribute('href').startsWith('/products/'))
    }
  } finally { window.close() }
})

// Kiểm thử edge case: thanh tìm kiếm hiển thị sản phẩm mẫu có ảnh, giới hạn số lượng và Auth chuyển đổi tab mượt mà.
test('header search suggestions show under search bar with images and more link, and auth tabs switch seamlessly', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  window.fetch = async (url) => String(url).includes('/customer/session') ? response(401, {}) :
    String(url).includes('/catalog') ? response(200, { products: [] }) : response(200, {})
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.header-inline-search input')))
    const searchInput = window.document.querySelector('.header-inline-search input')
    searchInput.focus()
    searchInput.dispatchEvent(new window.Event('focus', { bubbles: true }))
    await waitFor(() => Boolean(window.document.querySelector('#header-inline-suggestions')))
    const suggestions = window.document.querySelector('#header-inline-suggestions')
    assert.ok(suggestions)
    const items = suggestions.querySelectorAll('.search-suggestion')
    assert.ok(items.length > 0 && items.length <= 10)
    assert.ok(items[0].querySelector('img'))
    assert.ok(items[0].querySelector('strong'))
    assert.match(items[0].querySelector('small').textContent, /₫/)
    const moreLink = suggestions.querySelector('.search-suggestions__more')
    assert.ok(moreLink)
    assert.match(moreLink.textContent, /còn/)

    // Test chuyển tab Auth trên trang login
    window.document.querySelector('.account-link').click()
    await waitFor(() => Boolean(window.document.querySelector('.auth-panel')))
    assert.ok(window.document.querySelector('.auth-tabs button.is-active'))
    assert.match(window.document.querySelector('.auth-tabs button.is-active').textContent, /Đăng nhập/)

    // Bấm chuyển sang tab Đăng ký
    const tabs = window.document.querySelectorAll('.auth-tabs button')
    tabs[1].click()
    await waitFor(() => Boolean(window.document.querySelector('input[name="email"]')))
    assert.match(window.document.querySelector('.auth-tabs button.is-active').textContent, /Đăng ký/)

    // Bấm chuyển sang Quên mật khẩu
    tabs[0].click()
    await waitFor(() => Boolean(window.document.querySelector('.auth-forgot')))
    const forgotLink = window.document.querySelector('.auth-forgot')
    forgotLink.click()
    await waitFor(() => Boolean(window.document.querySelector('button[type="submit"]')) && window.document.querySelector('button[type="submit"]').textContent.includes('Gửi link'))
    assert.match(window.document.querySelector('h1').textContent, /Quên mật khẩu/)
  } finally { window.close() }
})

