import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeVoucherSelection } from '../src/storefront/voucherSelection.js'

const wallet = [{ code: 'GOODS1', scope: 'goods' }, { code: 'GOODS2', scope: 'goods' }, { code: 'SHIP1', scope: 'shipping' }, { code: 'SHIP2', scope: 'shipping' }]
test('chọn voucher mới cùng loại thay voucher cũ và vẫn ghép được hàng hóa với ship', () => {
  assert.deepEqual(normalizeVoucherSelection(['GOODS1', 'SHIP1', 'GOODS2'], wallet), ['GOODS2', 'SHIP1'])
  assert.deepEqual(normalizeVoucherSelection(['GOODS1', 'SHIP1', 'GOODS2', 'SHIP2'], wallet), ['GOODS2', 'SHIP2'])
})
test('làm mới kho loại voucher đã dùng hoặc hết hạn khỏi lựa chọn', () => {
  assert.deepEqual(normalizeVoucherSelection(['GOODS1', 'SHIP1'], wallet.filter(item => item.code !== 'GOODS1')), ['SHIP1'])
  assert.deepEqual(normalizeVoucherSelection(['GONE', 'GONE'], wallet), [])
})
test('voucher hàng hóa cũ không có scope vẫn thay đúng voucher cùng loại', () => {
  assert.deepEqual(normalizeVoucherSelection(['LEGACY', 'GOODS2', 'SHIP1'], [...wallet, { code: 'LEGACY' }]), ['GOODS2', 'SHIP1'])
})
