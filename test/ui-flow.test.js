import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const bundle = await build({
  entryPoints: ['src/main.jsx'], bundle: true, platform: 'browser', format: 'iife', write: false,
  jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})

async function waitFor(predicate) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.fail('UI did not reach the expected state')
}

function response(status, data) { return { ok: status >= 200 && status < 300, status, json: async () => data } }

test('guest can browse and add cart but checkout, favorites and chat require login', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
  window.fetch = async (url) => {
    if (String(url).endsWith('/api/customer/session')) return response(401, { error: 'LOGIN_REQUIRED' })
    if (String(url).includes('/catalog')) return response(200, { products: [] })
    if (String(url).includes('/reviews')) return response(200, { reviews: [] })
    return response(200, { viewCount: 1 })
  }
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.shop-hero-art')))
    window.document.querySelector('.shop-hero-art').click()
    await waitFor(() => window.location.pathname === '/products/1')
    assert.match(window.document.querySelector('h1').textContent, /Tai nghe Everyday/)
    window.document.querySelector('.product-detail-actions button').click()
    window.document.querySelector('a[href="/cart"]').click()
    await waitFor(() => window.location.pathname === '/cart')
    const checkbox = window.document.querySelector('.cart-select input')
    checkbox.click()
    await waitFor(() => Boolean(window.document.querySelector('a[href="/checkout"]')))
    window.document.querySelector('a[href="/checkout"]').click()
    await waitFor(() => window.location.pathname === '/checkout' && Boolean(window.document.querySelector('.auth-panel')))
    assert.equal(window.document.querySelector('.checkout-card'), null)
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

test('server-backed registration loads account without saving a browser password', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/register', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.scrollTo = () => {}
  let signedIn = false
  const account = { id: 1, username: 'demo-user', email: 'demo@example.com', points: 0, tier: 'bronze', spinCredits: 0, csrfToken: 'csrf-test' }
  window.fetch = async (url, options = {}) => {
    const path = String(url)
    if (path.includes('/customer/register')) { signedIn = true; return response(201, { account }) }
    if (path.includes('/customer/session')) return signedIn ? response(200, { authenticated: true, account }) : response(401, { error: 'LOGIN_REQUIRED' })
    if (path.includes('/customer/orders')) return response(200, { orders: [] })
    if (path.includes('/customer/vouchers')) return response(200, { vouchers: [] })
    if (path.includes('/customer/favorites')) return response(200, { ids: [] })
    if (path.includes('/customer/logout')) { signedIn = false; return response(200, { ok: true }) }
    if (path.includes('/customer/login')) { signedIn = true; return response(200, { account }) }
    if (path.includes('/catalog')) return response(200, { products: [] })
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
    assert.ok(window.document.querySelector('.cart-similar__grid .product-card'))
  } finally { window.close() }
})
