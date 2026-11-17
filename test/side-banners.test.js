/**
 * @codex-vn-doc
 * Tệp: test/side-banners.test.js
 * Mục đích: Kiểm thử unit cho src/services/sideBanners.js (normalize, resolve, split).
 * Thành phần chính: normalizeSideBanners, resolveSideBanners, splitSideBanners.
 * Liên kết trực tiếp: node:test, node:assert/strict, ../src/services/sideBanners.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeSideBanners,
  resolveSideBanners,
  splitSideBanners,
  SIDE_BANNER_MAX_PER_SIDE,
} from '../src/services/sideBanners.js'

const products = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  name: 'Sản phẩm ' + (index + 1),
  price: (index + 1) * 100000,
  image: '/products/p' + (index + 1) + '.webp',
  category: 'Điện tử',
  stockCount: 20,
  viewCount: index,
}))

const slot = (productId, extra = {}) => ({ productId, title: '', note: '', bg: '', text: '', accent: '', ...extra })

test('normalize parse được chuỗi JSON và object, bỏ slot không có productId', () => {
  const config = { version: 1, left: [slot('1'), { title: 'không id' }, slot('  '), slot('2')], right: [] }
  assert.deepEqual(normalizeSideBanners(JSON.stringify(config)), normalizeSideBanners(config))
  const normalized = normalizeSideBanners(config)
  assert.equal(normalized.version, 1)
  assert.deepEqual(normalized.left.map(item => item.productId), ['1', '2'])
  assert.deepEqual(normalized.right, [])
})

test('normalize trả rỗng với chuỗi JSON sai, null, số hoặc mảng', () => {
  for (const value of ['{không hợp lệ', null, undefined, 42, [], '   ']) {
    assert.deepEqual(normalizeSideBanners(value), { version: 1, left: [], right: [] })
  }
})

test('normalize cắt thừa quá 20 mỗi bên, cắt title 120 và note 240 ký tự', () => {
  assert.equal(SIDE_BANNER_MAX_PER_SIDE, 20)
  const many = Array.from({ length: 25 }, (_, index) => slot(String((index % 10) + 1)))
  const normalized = normalizeSideBanners({ left: many, right: many })
  assert.equal(normalized.left.length, 20)
  assert.equal(normalized.right.length, 20)
  const long = normalizeSideBanners({
    left: [slot('1', { title: 'x'.repeat(200), note: 'y'.repeat(300) })],
    right: [],
  })
  assert.equal(long.left[0].title.length, 120)
  assert.equal(long.left[0].note.length, 240)
})

test('normalize chỉ giữ màu #RRGGBB hợp lệ và chuẩn hóa thành chữ hoa', () => {
  const normalized = normalizeSideBanners({
    left: [slot('1', { bg: '#ffcc00', text: '#ABCDEF', accent: 'red' })],
    right: [slot('2', { bg: '#12345', text: '#1234567', accent: '#gg0000' })],
  })
  assert.equal(normalized.left[0].bg, '#FFCC00')
  assert.equal(normalized.left[0].text, '#ABCDEF')
  assert.equal(normalized.left[0].accent, '')
  assert.equal(normalized.right[0].bg, '')
  assert.equal(normalized.right[0].text, '')
  assert.equal(normalized.right[0].accent, '')
})

test('normalize KHÔNG khử trùng lặp productId', () => {
  const normalized = normalizeSideBanners({ left: [slot('1'), slot('1'), slot('1')], right: [] })
  assert.deepEqual(normalized.left.map(item => item.productId), ['1', '1', '1'])
})

test('resolve bỏ slot trỏ tới sản phẩm không tồn tại và KHÔNG đệm thêm sản phẩm', () => {
  const resolved = resolveSideBanners({
    left: [slot('1'), slot('999'), slot('2')],
    right: [slot('3')],
  }, products)
  // 3 slot trái, 1 slot không tồn tại → đúng 2 banner, không đệm lên 5.
  assert.equal(resolved.left.length, 2)
  assert.deepEqual(resolved.left.map(item => item.productId), ['1', '2'])
  assert.equal(resolved.right.length, 1)
  // Lưu ít hơn 5 thì render đúng số đó, không đệm.
  const few = resolveSideBanners({ left: [slot('1'), slot('2')], right: [] }, products)
  assert.equal(few.left.length, 2)
  assert.equal(few.right, null)
})

test('resolve trả null cho bên không còn slot hợp lệ, hai bên độc lập', () => {
  const resolved = resolveSideBanners({ left: [slot('999')], right: [slot('1')] }, products)
  assert.equal(resolved.left, null)
  assert.equal(resolved.right.length, 1)
  assert.deepEqual(resolveSideBanners({}, products), { left: null, right: null })
  assert.deepEqual(resolveSideBanners(undefined, products), { left: null, right: null })
})

test('resolve lấy tên/giá/ảnh từ sản phẩm, slot.title/note ghi đè', () => {
  const resolved = resolveSideBanners({
    left: [slot('1', { title: 'Tiêu đề riêng', note: 'Ghi chú riêng', bg: '#ffcc00' })],
    right: [slot('2')],
  }, products)
  assert.equal(resolved.left[0].title, 'Tiêu đề riêng')
  assert.equal(resolved.left[0].note, 'Ghi chú riêng')
  assert.equal(resolved.left[0].bg, '#FFCC00')
  assert.equal(resolved.left[0].product.name, 'Sản phẩm 1')
  assert.equal(resolved.left[0].product.price, 100000)
  assert.equal(resolved.left[0].product.image, '/products/p1.webp')
  // Không có title riêng thì dùng tên sản phẩm.
  assert.equal(resolved.right[0].title, 'Sản phẩm 2')
})

test('split giữ tỉ lệ mặc định: trái 4/11, phải 5/13', () => {
  const five = [1, 2, 3, 4, 5]
  assert.deepEqual([splitSideBanners(five, 'left').before.length, splitSideBanners(five, 'left').after.length], [2, 3])
  assert.deepEqual([splitSideBanners(five, 'right').before.length, splitSideBanners(five, 'right').after.length], [2, 3])
  assert.deepEqual([splitSideBanners(Array.from({ length: 10 }, (_, i) => i), 'left').before.length, splitSideBanners(Array.from({ length: 10 }, (_, i) => i), 'left').after.length], [4, 6])
  assert.deepEqual([splitSideBanners(Array.from({ length: 13 }, (_, i) => i), 'right').before.length, splitSideBanners(Array.from({ length: 13 }, (_, i) => i), 'right').after.length], [5, 8])
  assert.deepEqual([splitSideBanners(Array.from({ length: 11 }, (_, i) => i), 'left').before.length, splitSideBanners(Array.from({ length: 11 }, (_, i) => i), 'left').after.length], [4, 7])
})

test('split luôn ≥ 1 banner mỗi phía khi cột có ≥ 2 banner', () => {
  assert.deepEqual([splitSideBanners([1, 2], 'left').before.length, splitSideBanners([1, 2], 'left').after.length], [1, 1])
  assert.deepEqual([splitSideBanners([1, 2], 'right').before.length, splitSideBanners([1, 2], 'right').after.length], [1, 1])
  assert.deepEqual([splitSideBanners([1], 'left').before.length, splitSideBanners([1], 'left').after.length], [1, 0])
  assert.deepEqual([splitSideBanners([], 'left').before.length, splitSideBanners([], 'left').after.length], [0, 0])
})
