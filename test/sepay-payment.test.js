import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture, mount, waitFor, openQr } from './paymentFixture.js'

test('SePay tự hoàn tất từ trạng thái server, không cần khách nhập mã hay bấm báo tiền', async () => {
  const state = fixture()
  state.bankConfirmation = { configured: true, healthy: true, transfers: [] }
  const dom = mount(state)
  const { window } = dom
  try {
    await openQr(window)
    assert.match(window.document.querySelector('.bank-payment-card').textContent, /không cần nhập mã giao dịch/)
    const help = window.document.querySelector('.bank-payment-card details')
    assert.equal(help.open, false)
    assert.equal(state.created, false)
    assert.equal(state.payments.length, 0)
    state.confirmPayment()
    window.dispatchEvent(new window.Event('focus'))
    await waitFor(() => window.document.querySelector('.checkout-success'))
    assert.equal(window.location.pathname, '/checkout')
    assert.match(window.location.search, /order=QA-ORDER/)
    assert.match(window.document.querySelector('.checkout-success').textContent, /Thanh toán thành công/)
    assert.equal(state.creates, 1)
    assert.equal(state.payments.length, 0)
    await waitFor(() => JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length === 0)
  } finally { window.close() }
})

test('SePay mất kết nối hoặc tiền cần đối soát không hiện thành công và không dọn giỏ', async () => {
  const state = fixture()
  state.bankConfirmation = { configured: true, healthy: false, transfers: [] }
  const dom = mount(state)
  const { window } = dom
  try {
    await openQr(window)
    assert.match(window.document.querySelector('.bank-payment-card').textContent, /chờ kết nối/)
    state.phase = 'needs_review'
    state.bankConfirmation.transfers = [{ amount: 1, state: 'review' }]
    window.dispatchEvent(new window.Event('focus'))
    await waitFor(() => window.document.querySelector('.bank-payment-card').textContent.includes('Đã ghi nhận khoản chuyển từ ngân hàng'))
    assert.equal(state.created, false)
    assert.equal(window.location.pathname, '/checkout')
    assert.equal(JSON.parse(window.localStorage.getItem('storeCartAccountV2:qa')).length, 1)
    assert.equal(state.creates, 0)
  } finally { window.close() }
})
