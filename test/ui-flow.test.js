import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { webcrypto } from 'node:crypto'

const bundle = await build({
  entryPoints: ['src/main.jsx'], bundle: true, platform: 'browser', format: 'iife', write: false,
  jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})

async function waitFor(predicate) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.fail('UI did not reach the expected state')
}

test('detail returns to saved home scroll, cart checks only selected items, auth is isolated', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true })
  window.scrollTo = ({ top }) => { window.scrollY = top }
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
  window.fetch = async (url) => ({ ok: true, json: async () => String(url).includes('/catalog') ? { products: [] } : { viewCount: 1 } })
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => window.document.querySelector('.shop-hero-art'))
    window.scrollTo({ top: 720 })
    window.document.querySelector('.shop-hero-art').click()
    await waitFor(() => window.location.pathname === '/products/1')
    assert.match(window.document.querySelector('h1').textContent, /Tai nghe Everyday/)
    window.history.back()
    await waitFor(() => window.location.pathname === '/' && window.scrollY === 720)
    window.document.querySelector('[aria-label="Lên đầu trang ngay"]').click()
    assert.equal(window.scrollY, 0)
    window.document.querySelector('.theme-switch').click()
    await waitFor(() => window.document.documentElement.dataset.theme === 'dark')
    assert.equal(window.document.querySelector('.theme-switch').getAttribute('aria-checked'), 'true')
    window.document.querySelector('.customer-support__toggle').click()
    await waitFor(() => Boolean(window.document.querySelector('.customer-support--open')))
    assert.ok(window.document.querySelector('.customer-support--open > .customer-support__to-top'))
    window.document.querySelector('.customer-support__toggle').click()
    window.document.querySelectorAll('.product-bottom button')[0].click()
    window.document.querySelectorAll('.product-bottom button')[1].click()
    window.document.querySelector('a[href="/cart"]').click()
    await waitFor(() => window.location.pathname === '/cart')
    const checkbox = window.document.querySelector('.cart-select input')
    assert.equal(checkbox.checked, false)
    assert.equal(window.document.querySelector('a[href="/checkout"]'), null)
    checkbox.click()
    await waitFor(() => Boolean(window.document.querySelector('a[href="/checkout"]')))
    window.document.querySelector('a[href="/checkout"]').click()
    await waitFor(() => window.location.pathname === '/checkout')
    assert.match(window.document.querySelector('.summary-card').textContent, /Tai nghe Everyday/)
    assert.doesNotMatch(window.document.querySelector('.summary-card').textContent, /Túi Everyday Tote/)
    window.document.querySelector('.checkout-card').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => Boolean(window.document.querySelector('.order-success')))
    window.document.querySelector('a[href="/cart"]').click()
    await waitFor(() => window.location.pathname === '/cart')
    assert.equal(window.document.querySelectorAll('.cart-item').length, 1)
    assert.match(window.document.querySelector('.cart-item').textContent, /Túi Everyday Tote/)
    window.document.querySelector('a[href="/contact"]').click()
    await waitFor(() => window.location.pathname === '/contact')
    assert.equal(window.document.querySelectorAll('.contact-map-preview img').length, 15)
    assert.match(window.document.querySelector('.contact-map-open').href, /mlat=10\.3460/)
    window.document.querySelector('a[href="/rewards"]').click()
    await waitFor(() => window.location.pathname === '/rewards')
    window.document.querySelector('.lucky-spin').click()
    await waitFor(() => Boolean(window.document.querySelector('[role="dialog"]')))
    window.document.querySelector('.reward-modal__close').click()
    await waitFor(() => !window.document.querySelector('[role="dialog"]'))
    window.document.querySelector('a[href="/account"]').click()
    await waitFor(() => window.location.pathname === '/account')
    assert.ok(window.document.querySelector('.auth-panel'))
    assert.equal(window.document.querySelector('.site-header'), null)
    assert.equal(window.document.querySelector('.site-footer'), null)
  } finally { window.close() }
})

test('browser-local demo registration and login work without storing a plaintext password', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/register', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  Object.defineProperty(window.crypto, 'subtle', { value: webcrypto.subtle })
  window.TextEncoder = TextEncoder
  window.scrollTo = () => {}
  window.fetch = async () => ({ ok: true, json: async () => ({ products: [] }) })
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.auth-panel form')))
    const register = window.document.querySelector('.auth-panel form')
    register.elements.username.value = 'demo-user'
    register.elements.email.value = 'demo@example.com'
    register.elements.password.value = 'demo-password-123'
    register.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => window.location.pathname === '/account' && Boolean(window.document.querySelector('.account-profile')))
      .catch((error) => { throw new Error(window.document.querySelector('.auth-error')?.textContent || error.message) })
    assert.ok(window.document.querySelector('.account-page').lastElementChild.classList.contains('account-logout'))
    const stored = window.localStorage.getItem('storeDemoUsersV1')
    assert.ok(stored)
    assert.doesNotMatch(stored, /demo-password-123/)
    window.document.querySelector('.account-logout button').click()
    await waitFor(() => Boolean(window.document.querySelector('.auth-panel form')))
    const login = window.document.querySelector('.auth-panel form')
    login.elements.username.value = 'demo-user'
    login.elements.password.value = 'demo-password-123'
    login.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => Boolean(window.document.querySelector('.account-profile')))
    assert.match(window.document.querySelector('.account-profile').textContent, /demo-user/)
  } finally { window.close() }
})

test('out-of-stock cart item is dimmed, cannot be selected and shows similar goods', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/cart', pretendToBeVisual: true, runScripts: 'outside-only' })
  const { window } = dom
  window.localStorage.setItem('storeCartV1', JSON.stringify([{ id: 1, name: 'Tai nghe Everyday', price: 890000, quantity: 1, selected: true }]))
  window.scrollTo = () => {}
  window.fetch = async (url) => ({ ok: true, json: async () => String(url).includes('/catalog') ? { products: [{ id: '1', discountPercent: 0, stockCount: 0, viewCount: 0 }] } : {} })
  window.eval(bundle.outputFiles[0].text)
  try {
    await waitFor(() => Boolean(window.document.querySelector('.cart-item--out')))
    assert.match(window.document.querySelector('.cart-item--out').textContent, /Hết hàng/)
    assert.equal(window.document.querySelector('.cart-select input').disabled, true)
    assert.equal(window.document.querySelector('a[href="/checkout"]'), null)
    assert.ok(window.document.querySelector('.cart-similar__grid .product-card'))
  } finally { window.close() }
})
