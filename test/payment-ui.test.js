import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture, mount, waitFor, button, setInput, openQr } from './paymentFixture.js'
import { PAYMENT_WINDOW_MS, formatPaymentTime, paymentSecondsRemaining } from '../src/components/commerce/paymentWindow.js'

test('đồng hồ đúng 2 phút', () => {
  assert.equal(PAYMENT_WINDOW_MS, 120000)
  assert.equal(paymentSecondsRemaining(120000, 0), 120)
  assert.equal(formatPaymentTime(120), '02:00')
  assert.equal(formatPaymentTime(paymentSecondsRemaining(120000, 119999)), '00:01')
  assert.equal(paymentSecondsRemaining(120000, 120001), 0)
})

test('thoát/hết giờ về form giữ dữ liệu/giỏ; chỉ thanh toán mới lưu đơn', async () => {
  const state = fixture()
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    await openQr(window)
    assert.equal(state.creates, 0)
    assert.equal(state.created, false)
    assert.equal(window.location.search, '')
    assert.equal(JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length, 1)
    button(document, 'Thoát thanh toán').click()
    await waitFor(() => !document.querySelector('.bank-payment-card')
      && document.querySelector('form.checkout-card'))
    assert.equal(document.querySelector('[name="recipient"]').value, 'Người nhận đã nhập')
    assert.equal(document.querySelector('[name="phone"]').value, '0901234567')
    assert.equal(document.querySelector('[name="address"]').value, '12 Đường kiểm thử')
    assert.equal(document.querySelector('.checkout-order-return'), null)
    assert.equal(state.creates, 0)
    await openQr(window)
    const now = window.Date.now()
    window.Date.now = () => now + 120001
    window.dispatchEvent(new window.Event('focus'))
    await waitFor(() => !document.querySelector('.bank-payment-card')
      && document.querySelector('form.checkout-card'))
    assert.match(document.querySelector('.checkout-payment-notice').textContent, /hết 2 phút/i)
    assert.equal(state.creates, 0)
    assert.equal(JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length, 1)
    await openQr(window)
    const pay = button(document, 'Mô phỏng chuyển khoản thành công')
    pay.click()
    pay.click()
    await waitFor(() => window.location.pathname === '/')
    assert.equal(state.creates, 1)
    assert.equal(state.payments.length, 1)
    await waitFor(() => JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length === 0)
    document.querySelector('.cart-notice a').click()
    await waitFor(() => document.querySelector('.account-payment-notifications li'))
    assert.match(document.querySelector('.account-payment-notifications').textContent, /Đã xác nhận thanh toán/)
  } finally { window.close() }
  const reloaded = mount(state, '/account')
  try {
    await waitFor(() => reloaded.window.document.querySelector('.account-payment-notifications li'))
    assert.match(reloaded.window.document.querySelector('.account-payment-notifications').textContent, /QA-ORDER/)
  } finally { reloaded.window.close() }
})

test('chuyển khoản thật: lỗi mạng chưa lưu; xác nhận lưu mã để đối soát', async () => {
  const state = fixture('manual')
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    await openQr(window)
    setInput(window, document.querySelector('.bank-payment-details input'), 'BANK-123')
    await waitFor(() => button(document, 'Tôi đã chuyển khoản').disabled === false)
    state.failPayment = true
    button(document, 'Tôi đã chuyển khoản').click()
    await waitFor(() => document.querySelector('.commerce-error'))
    assert.match(document.querySelector('.commerce-error').textContent, /Không thể kết nối/)
    assert.equal(state.created, false)
    state.failPayment = false
    button(document, 'Tôi đã chuyển khoản').click()
    await waitFor(() => window.location.pathname === '/')
    assert.equal(state.payments.at(-1).body.reference, 'BANK-123')
    assert.equal(state.creates, 1)
    assert.equal(state.order.status, 'pending')
  } finally { window.close() }
})

test('hết giờ hủy request đang chờ; phản hồi muộn không ghi đơn/đổi trang', async () => {
  const state = fixture()
  state.deferPayment = true
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    await openQr(window)
    button(document, 'Mô phỏng chuyển khoản thành công').click()
    await waitFor(() => state.resolvePayment)
    const now = window.Date.now()
    window.Date.now = () => now + 120001
    window.dispatchEvent(new window.Event('focus'))
    await waitFor(() => !document.querySelector('.bank-payment-card')
      && document.querySelector('form.checkout-card'))
    state.resolvePayment()
    await new Promise(resolve => setTimeout(resolve, 30))
    assert.equal(window.location.pathname, '/checkout')
    assert.equal(state.created, false)
    assert.equal(state.creates, 0)
    assert.equal(document.querySelector('.bank-payment-card'), null)
  } finally { window.close() }
})

test('đơn cũ mở QR cũng trở về form, không tạo trang giao nhận riêng', async () => {
  const state = fixture('demo', true)
  state.emptyCart = true
  const dom = mount(state, '/checkout?order=QA-ORDER')
  const { window } = dom
  try {
    await waitFor(() => window.document.querySelector('[role="timer"]'))
    button(window.document, 'Thoát thanh toán').click()
    await waitFor(() => window.document.querySelector('form.checkout-card'))
    assert.equal(window.location.search, '')
    assert.equal(window.document.querySelector('.checkout-order-return'), null)
    assert.equal(window.document.querySelector('[name="phone"]').value, '0901234567')
    assert.match(window.document.querySelector('.summary-card').textContent, /Gạo kiểm thử/)
  } finally { window.close() }
})

