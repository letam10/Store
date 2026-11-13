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

export function fixture(mode = 'manual', existing = false) {
  const state = { order: { ...savedOrder }, created: false, active: existing, creates: 0, previews: 0, payments: [], cancellations: 0 }
  state.now = () => Date.now()
  state.expiresAt = new Date(Date.now() + 120000).toISOString()
  state.phase = 'pending'
  state.confirmPayment = () => {
    if (!state.created) state.creates += 1
    state.created = true
    state.phase = 'paid'
    state.order = { ...state.order, status: 'paid', paymentState: 'paid', paidAt: new Date(state.now()).toISOString() }
  }
  const payment = {
    mode, amount: 230000, reference: 'STORE QA-ORDER', bankName: 'Ngân hàng kiểm thử',
    accountNumber: '000000000000', accountName: 'STORE TEST', purpose: 'Thanh toán đơn hàng',
    qrImage: 'data:image/png;base64,iVBORw0KGgo=',
  }
  const payload = () => {
    if (state.phase === 'pending' && state.now() >= Date.parse(state.expiresAt)) state.phase = 'expired'
    const canPay = state.phase === 'pending'
    return { sessionId: state.order.id, expiresAt: state.expiresAt, serverTime: new Date(state.now()).toISOString(),
      bankConfirmation: state.bankConfirmation,
      order: { ...state.order, paymentState: state.phase }, status: state.phase, canPay, payment: canPay ? { ...payment, amount: state.order.total } : null }
  }
  state.fetch = async (url, options = {}) => {
    const path = new URL(url, 'http://localhost').pathname
    let result = {}
    if (path.endsWith('/session')) result = { account }
    else if (path.endsWith('/quote')) result = {
      total: state.quoteTotal || 230000, subtotal: (state.quoteTotal || 230000) - 30000, goodsTotal: (state.quoteTotal || 230000) - 30000, shippingFee: 30000,
      shippingFeeBeforeDiscount: 30000, shippingDiscount: 0,
    }
    else if (path.endsWith('/payment-sessions') && options.method === 'POST') {
      if (state.forceQuoteChange && !state.priceChanged) {
        state.priceChanged = true
        state.quoteTotal = 250000
        return { ok: false, status: 409, json: async () => ({ error: 'QUOTE_CHANGED' }) }
      }
      state.previews += 1
      state.order.total = state.quoteTotal || 230000
      state.active = true
      const nextRequest = JSON.parse(options.body)
      if (nextRequest.requestId !== state.lastRequest?.requestId) {
        state.expiresAt = new Date(state.now() + 120000).toISOString()
        state.phase = 'pending'
      }
      state.lastRequest = nextRequest
      result = payload()
    } else if (options.method === 'DELETE') { state.cancellations += 1; state.phase = 'cancelled' }
    else if (path.endsWith('/pending-checkouts')) result = { orders: state.active && !state.created ? [{ ...state.order, paymentState: state.phase }] : [] }
    else if (path.endsWith('/customer/orders')) result = { orders: state.created ? [state.order] : [] }
    else if (path.endsWith('/payment-report')) {
      state.payments.push({ path, body: JSON.parse(options.body) })
      if (state.deferPayment) await new Promise(resolve => { state.resolvePayment = resolve })
      if (state.failPayment) throw new TypeError('Failed to fetch')
      state.phase = state.now() >= Date.parse(state.expiresAt) ? 'needs_review' : 'reported'
      state.order.paymentReportedAt = new Date(state.now()).toISOString()
      if (options.signal?.aborted) throw new DOMException('Đã hủy', 'AbortError')
      result = payload()
    } else if (path.endsWith('/payment-info') || path.includes('/payment-sessions/')) result = payload()
    else if (path.endsWith('/receipt')) result = { order: state.order, afterSales: [], events: [] }
    else if (path.endsWith('/catalog')) result = { products: [product] }
    else if (path.endsWith('/appearance')) result = { appearance: {} }
    else if (path.endsWith('/vouchers')) result = { vouchers: [] }
    else if (path.endsWith('/favorites')) result = { ids: [] }
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(result)) }
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
  if (state.savedDraftItems) window.localStorage.setItem('storeCheckoutItems:qa:QA-ORDER', JSON.stringify(state.savedDraftItems))
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

