import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { JSDOM } from 'jsdom'

const bundle = await build({
  entryPoints: ['src/main.jsx'], bundle: true, platform: 'browser', format: 'iife', write: false,
  jsx: 'automatic', loader: { '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
})
const product = { id: 'qa-rice', name: 'Gạo kiểm thử', category: 'food', price: 200000, stockCount: 10 }
const savedOrder = {
  id: 'QA-ORDER', status: 'pending', paymentMethod: 'bank_transfer', total: 230000,
  goodsTotal: 200000, deliveryStatus: 'processing', itemCount: 1, items: [{ ...product, quantity: 1 }],
  recipient: 'Khách kiểm thử', phone: '0901234567', address: '12 Đường kiểm thử', fulfillment: 'delivery',
  scheduledAt: '2026-10-12T02:00:00.000Z', createdAt: '2026-10-09T02:00:00.000Z',
}
const account = { id: 'qa', username: 'Khách kiểm thử', csrfToken: 'csrf', tier: 'bronze', points: 0, spinCredits: 0 }

export async function waitFor(predicate) {
  for (let index = 0; index < 120; index += 1) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.fail('Giao diện chưa tới trạng thái cần kiểm tra')
}

export function fixture(mode = 'demo', created = false) {
  const state = { order: { ...savedOrder }, created, creates: 0, previews: 0, payments: [], cancellations: 0 }
  state.now = () => Date.now()
  const payment = {
    mode, amount: 230000, reference: 'STORE QA-ORDER', bankName: 'Ngân hàng kiểm thử',
    accountNumber: '1234567890', accountName: 'STORE TEST', purpose: 'Thanh toán đơn hàng',
    qrImage: 'data:image/png;base64,iVBORw0KGgo=',
  }
  state.fetch = async (url, options = {}) => {
    const path = new URL(url, 'http://localhost').pathname
    let payload = {}
    if (path.endsWith('/session')) payload = { account }
    else if (path.endsWith('/quote')) payload = {
      total: 230000, subtotal: 200000, goodsTotal: 200000, shippingFee: 30000,
      shippingFeeBeforeDiscount: 30000, shippingDiscount: 0,
    }
    else if (path.endsWith('/payment-sessions') && options.method === 'POST') {
      state.previews += 1
      state.expiresAt = new Date(state.now() + 120000).toISOString()
      payload = { sessionId: state.order.id, expiresAt: state.expiresAt, order: state.order, payment }
    } else if (options.method === 'DELETE') state.cancellations += 1
    else if (path.endsWith('/customer/orders')) {
      if (options.method === 'POST') {
        state.creates += 1
        state.created = true
        payload = { order: state.order }
      } else payload = { orders: state.created ? [state.order] : [] }
    } else if (path.endsWith('/simulate-pay') || path.endsWith('/payment-report')) {
      state.payments.push({ path, body: JSON.parse(options.body) })
      if (state.deferPayment) await new Promise(resolve => { state.resolvePayment = resolve })
      if (options.signal?.aborted) throw new DOMException('Đã hủy', 'AbortError')
      if (state.failPayment) throw new TypeError('Failed to fetch')
      state.creates += state.created ? 0 : 1
      state.created = true
      state.order = mode === 'demo'
        ? { ...state.order, status: 'paid', paidAt: '2026-10-09T03:00:00.000Z' }
        : { ...state.order, paymentReportedAt: '2026-10-09T03:00:00.000Z' }
      payload = { order: state.order, reported: mode === 'manual' }
    } else if (path.endsWith('/payment-info') || path.includes('/payment-sessions/')) {
      payload = { sessionId: state.order.id, expiresAt: state.expiresAt, order: state.order, payment }
    } else if (path.endsWith('/receipt')) payload = { order: state.order, afterSales: [], events: [] }
    else if (path.endsWith('/catalog')) payload = { products: [product] }
    else if (path.endsWith('/appearance')) payload = { appearance: {} }
    else if (path.endsWith('/vouchers')) payload = { vouchers: [] }
    else if (path.endsWith('/favorites')) payload = { ids: [] }
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(payload)) }
  }
  return state
}

export function mount(state, pathname = '/checkout') {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost' + pathname, pretendToBeVisual: true, runScripts: 'outside-only',
  })
  const { window } = dom
  state.now = () => window.Date.now()
  window.fetch = state.fetch
  window.scrollTo = () => {}
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
  window.localStorage.setItem('storeCartAccountV2:qa', JSON.stringify(state.cartItems || (state.emptyCart
    ? [] : [{ ...product, quantity: 1, selected: true }])))
  window.eval(bundle.outputFiles[0].text)
  return dom
}

export function button(document, label) {
  const found = [...document.querySelectorAll('button')].find(node => node.textContent.trim() === label)
  assert.ok(found, label)
  return found
}

export function setInput(window, input, value) {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value)
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
}

export async function openQr(window) {
  const { document } = window
  await waitFor(() => document.querySelector('form.checkout-card button[type="submit"]')?.disabled === false)
  setInput(window, document.querySelector('[name="recipient"]'), 'Người nhận đã nhập')
  setInput(window, document.querySelector('[name="phone"]'), '0901234567')
  setInput(window, document.querySelector('[name="address"]'), '12 Đường kiểm thử')
  await new Promise(resolve => setTimeout(resolve, 0))
  document.querySelector('form.checkout-card').dispatchEvent(new window.Event('submit', {
    bubbles: true, cancelable: true,
  }))
  await waitFor(() => document.querySelector('[role="timer"]')?.textContent === '02:00')
}

