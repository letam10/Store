import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture, mount, button, setInput, waitFor } from './paymentFixture.js'

test('checkout validates manual codes before selecting, keeps invalid input and replaces a voucher of the same scope', async () => {
  const state = fixture('manual')
  const originalFetch = state.fetch
  const vouchers = {
    GOODS001: { code: 'GOODS001', label: 'Giảm hàng hóa', scope: 'goods', type: 'amount', value: 10000 },
    GOODS002: { code: 'GOODS002', label: 'Giảm hàng hóa mới', scope: 'goods', type: 'amount', value: 20000 },
    SHIP0001: { code: 'SHIP0001', label: 'Giảm phí ship', scope: 'shipping', type: 'amount', value: 5000 },
  }
  let codes = []
  state.fetch = async (url, options = {}) => {
    if (url.includes('/customer/vouchers/')) {
      const code = decodeURIComponent(url.split('/').at(-1))
      const voucher = vouchers[code]
      return { ok: Boolean(voucher), status: voucher ? 200 : 404, json: async () => voucher ? { voucher } : { error: 'INVALID_VOUCHER' } }
    }
    if (url.endsWith('/quote')) codes = JSON.parse(options.body).voucherCodes
    return originalFetch(url, options)
  }
  const dom = mount(state)
  const { window } = dom
  try {
    await waitFor(() => window.document.querySelector('[aria-label="Mã voucher"]'))
    const input = window.document.querySelector('[aria-label="Mã voucher"]')
    async function apply(code) {
      setInput(window, input, code)
      await new Promise(resolve => setTimeout(resolve, 0))
      button(window.document, 'Áp dụng mã').click()
    }
    await apply('INVALID')
    await waitFor(() => window.document.querySelector('.checkout-voucher [role="alert"]'))
    assert.equal(input.value, 'INVALID')
    assert.deepEqual(codes, [])
    for (const code of ['goods001', 'SHIP0001', 'GOODS002']) {
      await apply(code)
      await waitFor(() => window.document.querySelector('.checkout-voucher [role="status"]')?.textContent.includes(code.toUpperCase()))
      await waitFor(() => codes.includes(code.toUpperCase()))
      assert.equal(input.value, '')
    }
    assert.deepEqual(codes, ['GOODS002', 'SHIP0001'])
  } finally { window.close() }
})
