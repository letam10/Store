import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture, mount, waitFor, button, setInput, openQr } from './paymentFixture.js'
import { PAYMENT_WINDOW_MS, formatPaymentTime, paymentSecondsRemaining } from '../src/utils/paymentWindow.js'

test('đồng hồ đúng 2 phút', () => {
  assert.equal(PAYMENT_WINDOW_MS, 120000)
  assert.equal(paymentSecondsRemaining(120000, 0), 120)
  assert.equal(formatPaymentTime(120), '02:00')
  assert.equal(formatPaymentTime(paymentSecondsRemaining(120000, 119999)), '00:01')
  assert.equal(paymentSecondsRemaining(120000, 120001), 0)
})

test('đóng QR giữ form và giỏ; hết hạn ẩn QR nhưng không ghi nhận mua hàng', async () => {
  const state = fixture()
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    await openQr(window)
    assert.equal(state.created, false)
    assert.match(window.location.search, /payment=QA-ORDER/)
    assert.ok(state.lastRequest.requestId)
    const expires = state.expiresAt
    button(document, 'Về trang thanh toán').click()
    await waitFor(() => !document.querySelector('.bank-payment-card'))
    assert.equal(document.querySelector('[name="recipient"]').value, 'Người nhận đã nhập')
    assert.equal(document.querySelector('[name="phone"]').value, '0901234567')
    assert.equal(document.querySelector('[name="address"]').value, '12 Đường kiểm thử')
    assert.equal(state.cancellations, 0)
    assert.equal(state.creates, 0)
    await openQr(window)
    assert.equal(state.expiresAt, expires)
    const now = window.Date.now()
    window.Date.now = () => now + 120001
    window.dispatchEvent(new window.Event('focus'))
    await waitFor(() => !document.querySelector('.bank-payment-qr img'))
    assert.match(document.querySelector('.bank-payment-card').textContent, /hết hạn/)
    assert.equal(state.creates, 0)
    assert.equal(JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length, 1)
    assert.doesNotMatch(document.body.textContent, /Mô phỏng chuyển khoản/)
  } finally { window.close() }
})

test('báo chuyển khoản không hoàn tất đơn; chỉ poll đã đối soát mới lưu lịch sử và dọn giỏ', async () => {
  const state = fixture()
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    await openQr(window)
    setInput(window, document.querySelector('.bank-payment-details input'), 'BANK-123')
    await waitFor(() => !button(document, 'Tôi đã chuyển khoản').disabled)
    state.failPayment = true
    button(document, 'Tôi đã chuyển khoản').click()
    await waitFor(() => document.querySelector('.commerce-error'))
    assert.equal(state.created, false)
    state.failPayment = false
    const pay = button(document, 'Tôi đã chuyển khoản')
    pay.click()
    pay.click()
    await waitFor(() => document.querySelector('.bank-payment-card').textContent.includes('Chờ cửa hàng đối soát'))
    assert.equal(state.payments.length, 2, 'một lần lỗi và một lần gửi lại, không gửi đôi')
    assert.equal(state.order.status, 'pending')
    assert.equal(state.created, false)
    assert.equal(window.location.pathname, '/checkout')
    assert.equal(JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length, 1)
    assert.equal(document.querySelector('.bank-payment-qr img'), null)
    state.confirmPayment()
    window.dispatchEvent(new window.Event('focus'))
    await waitFor(() => window.location.pathname === '/')
    await waitFor(() => JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length === 0)
    document.querySelector('.cart-notice a').click()
    await waitFor(() => document.querySelector('.account-payment-notifications li'))
    assert.match(document.querySelector('.account-payment-notifications').textContent, /Đã xác nhận thanh toán/)
  } finally { window.close() }
})

test('đóng QR khi báo tiền đang chờ không để phản hồi muộn điều hướng hay dọn giỏ', async () => {
  const state = fixture()
  state.deferPayment = true
  const dom = mount(state)
  const { window } = dom
  try {
    await openQr(window)
    setInput(window, window.document.querySelector('.bank-payment-details input'), 'BANK-LATE')
    await waitFor(() => !button(window.document, 'Tôi đã chuyển khoản').disabled)
    button(window.document, 'Tôi đã chuyển khoản').click()
    await waitFor(() => state.resolvePayment)
    button(window.document, 'Về trang thanh toán').click()
    await waitFor(() => !window.document.querySelector('.bank-payment-card'))
    state.resolvePayment()
    await new Promise(resolve => setTimeout(resolve, 30))
    assert.equal(window.location.pathname, '/checkout')
    assert.equal(state.created, false)
    assert.equal(JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length, 1)
  } finally { window.close() }
})

test('đường dẫn phiên đã lưu tải lại đúng QR và giữ thông tin khi đóng', async () => {
  const state = fixture('manual', true)
  state.emptyCart = true
  const dom = mount(state, '/checkout?order=QA-ORDER')
  const { window } = dom
  try {
    await waitFor(() => window.document.querySelector('[role="timer"]'))
    button(window.document, 'Về trang thanh toán').click()
    await waitFor(() => window.document.querySelector('form.checkout-card'))
    assert.equal(window.location.search, '')
    assert.equal(window.document.querySelector('[name="phone"]').value, '0901234567')
    assert.match(window.document.querySelector('.summary-card').textContent, /Gạo kiểm thử/)
  } finally { window.close() }
})

test('đóng phiên chờ rồi vào tài khoản sau khi admin xác nhận vẫn dọn giỏ đúng', async () => {
  const state = fixture()
  const dom = mount(state)
  const { window } = dom
  try {
    await openQr(window)
    setInput(window, window.document.querySelector('.bank-payment-details input'), 'BANK-CLOSED')
    await waitFor(() => !button(window.document, 'Tôi đã chuyển khoản').disabled)
    button(window.document, 'Tôi đã chuyển khoản').click()
    await waitFor(() => state.phase === 'reported')
    button(window.document, 'Về trang thanh toán').click()
    await waitFor(() => !window.document.querySelector('.bank-payment-card'))
    state.confirmPayment()
    window.history.pushState({}, '', '/account')
    window.dispatchEvent(new window.PopStateEvent('popstate'))
    await waitFor(() => window.document.querySelector('.account-payment-notifications li'))
    await waitFor(() => JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length === 0)
  } finally { window.close() }
})

test('tải lại hồ sơ sau đối soát dọn bản nháp đúng tài khoản, không bị giỏ guest ghi đè', async () => {
  const state = fixture()
  state.confirmPayment()
  state.savedDraftItems = [{ id: 'qa-rice', quantity: 1 }]
  const dom = mount(state, '/account')
  try {
    await waitFor(() => dom.window.document.querySelector('.account-payment-notifications li'))
    await waitFor(() => JSON.parse(dom.window.localStorage.getItem('storeCartAccountV2:qa')).length === 0)
    assert.equal(dom.window.localStorage.getItem('storeCheckoutItems:qa:QA-ORDER'), null)
  } finally { dom.window.close() }
})

test('giá đổi khi gửi đơn thì tải lại báo giá và chờ khách bấm xác nhận tổng mới', async () => {
  const state = fixture()
  state.forceQuoteChange = true
  const dom = mount(state)
  const { window } = dom
  try {
    await waitFor(() => window.document.querySelector('form.checkout-card button[type="submit"]')?.disabled === false)
    setInput(window, window.document.querySelector('[name="phone"]'), '0901234567')
    setInput(window, window.document.querySelector('[name="address"]'), 'Địa chỉ kiểm tra')
    await new Promise(resolve => setTimeout(resolve, 0))
    const form = window.document.querySelector('form.checkout-card')
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => form.querySelector('[type=submit]').textContent.includes('250.000'))
    assert.equal(state.previews, 0)
    assert.equal(window.document.querySelector('.bank-payment-card'), null)
    assert.match(window.document.querySelector('.checkout-payment-notice').textContent, /Giá đã thay đổi/)
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }))
    await waitFor(() => window.document.querySelector('.bank-payment-card'))
    assert.equal(state.lastRequest.expectedTotal, 250000)
    assert.equal(state.previews, 1)
  } finally { window.close() }
})
