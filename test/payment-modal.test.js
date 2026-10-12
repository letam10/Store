import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture, mount, waitFor, button, openQr } from './paymentFixture.js'

test('QR nổi giữ cùng form ở nền, khóa cuộn và khôi phục vị trí khi đóng', async () => {
  const state = fixture()
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    await waitFor(() => document.querySelector('form.checkout-card button[type="submit"]')?.disabled === false)
    const form = document.querySelector('form.checkout-card')
    const submit = form.querySelector('button[type="submit"]')
    const scrolls = []
    window.scrollTo = options => scrolls.push(options)
    Object.defineProperty(window, 'scrollY', { value: 418, configurable: true })
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'scroll'
    submit.focus()
    await openQr(window)
    const dialog = document.querySelector('[role="dialog"]')
    assert.ok(dialog)
    assert.equal(dialog.getAttribute('aria-modal'), 'true')
    assert.ok(dialog.parentElement.parentElement === document.body)
    assert.ok(document.querySelector('form.checkout-card') === form)
    assert.equal(form.isConnected, true)
    assert.equal(document.getElementById('root').hasAttribute('inert'), true)
    assert.equal(document.documentElement.style.overflow, 'hidden')
    assert.equal(document.body.style.overflow, 'hidden')
    assert.equal(document.documentElement.style.getPropertyPriority('overflow'), 'important')
    assert.equal(document.body.style.getPropertyPriority('overflow'), 'important')
    assert.equal(scrolls.length, 0)
    assert.equal(state.creates, 0)
    button(document, 'Thoát thanh toán').click()
    await waitFor(() => !document.querySelector('[role="dialog"]'))
    assert.ok(document.querySelector('form.checkout-card') === form)
    assert.equal(document.querySelector('[name="recipient"]').value, 'Người nhận đã nhập')
    assert.equal(document.querySelector('[name="phone"]').value, '0901234567')
    assert.equal(document.querySelector('[name="address"]').value, '12 Đường kiểm thử')
    assert.equal(document.getElementById('root').hasAttribute('inert'), false)
    assert.equal(document.documentElement.style.overflow, 'auto')
    assert.equal(document.body.style.overflow, 'scroll')
    assert.deepEqual({ ...scrolls.at(-1) }, { left: 0, top: 418, behavior: 'instant' })
    assert.ok(document.activeElement === submit)
    assert.equal(state.creates, 0)
  } finally { window.close() }
})

test('Tab giữ focus trong card QR, Escape đóng phiên và có thể mở lại', async () => {
  const state = fixture()
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    await openQr(window)
    const dialog = document.querySelector('[role="dialog"]')
    assert.ok(dialog)
    const close = document.querySelector('[aria-label="Đóng thanh toán"]')
    const last = button(document, 'Thoát thanh toán')
    assert.ok(document.activeElement === close)
    last.focus()
    last.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    assert.ok(document.activeElement === close)
    close.dispatchEvent(new window.KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
    }))
    assert.ok(document.activeElement === last)
    document.querySelector('[name="phone"]').focus()
    assert.ok(document.activeElement === close)
    close.dispatchEvent(new window.KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true, cancelable: true,
    }))
    await waitFor(() => !document.querySelector('[role="dialog"]'))
    assert.equal(state.creates, 0)
    assert.match(document.querySelector('.checkout-payment-notice').textContent, /Đã thoát thanh toán/)
    await openQr(window)
    assert.ok(document.querySelector('[role="dialog"]'))
    document.querySelector('[aria-label="Đóng thanh toán"]').click()
    await waitFor(() => !document.querySelector('[role="dialog"]'))
    assert.equal(document.getElementById('root').hasAttribute('inert'), false)
    assert.equal(document.body.style.overflow, '')
    assert.equal(state.creates, 0)
  } finally { window.close() }
})

test('đóng card đưa focus về nút thanh toán khi trước đó focus ở body', async () => {
  const state = fixture()
  const dom = mount(state)
  const { window } = dom
  const { document } = window
  try {
    assert.ok(document.activeElement === document.body)
    await openQr(window)
    button(document, 'Thoát thanh toán').click()
    await waitFor(() => !document.querySelector('[role="dialog"]'))
    assert.ok(document.activeElement.matches('[data-payment-trigger]'))
    assert.equal(state.creates, 0)
  } finally { window.close() }
})
