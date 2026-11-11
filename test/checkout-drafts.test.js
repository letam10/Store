import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeCheckoutDraft, subtractCheckoutItems } from '../src/utils/checkoutDrafts.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}

test('đơn được đối soát sau khi đóng QR chỉ dọn giỏ một lần qua tải lại và callback', () => {
  const storage = memoryStorage()
  storage.setItem('storeCheckoutItems:7:ST-PAID', JSON.stringify([{ id: 'bag', quantity: 1 }]))
  assert.deepEqual(consumeCheckoutDraft(storage, 7, 'ST-PAID'), [{ id: 'bag', quantity: 1 }])
  assert.deepEqual(consumeCheckoutDraft(storage, 7, 'ST-PAID', [{ id: 'bag', quantity: 1 }]), [])
  assert.equal(storage.getItem('storeCheckoutItems:7:ST-PAID'), null)
})

test('không dọn giỏ tài khoản khác hoặc đơn cũ không có bản nháp trên máy', () => {
  const storage = memoryStorage()
  storage.setItem('storeCheckoutItems:7:ST-PAID', JSON.stringify([{ id: 'bag', quantity: 1 }]))
  assert.deepEqual(consumeCheckoutDraft(storage, 8, 'ST-PAID'), [])
  assert.deepEqual(consumeCheckoutDraft(storage, 7, 'ANOTHER-ORDER'), [])
  assert.ok(storage.getItem('storeCheckoutItems:7:ST-PAID'))
})

test('giữ số lượng khách thêm sau lúc mở QR, cộng đúng lượng mua ở nhiều đơn', () => {
  const cart = [{ id: 'bag', quantity: 5 }, { id: 'cup', quantity: 1 }]
  assert.deepEqual(subtractCheckoutItems(cart, [{ id: 'bag', quantity: 1 }, { id: 'bag', quantity: 2 }]), [{ id: 'bag', quantity: 2 }, { id: 'cup', quantity: 1 }])
})
