/**
 * @codex-vn-doc
 * Tệp: test/side-banners.test.js
 * Mục đích: Kiểm thử unit cho src/services/sideBanners.js (normalize, resolve, split).
 * Thành phần chính: normalizeSideBanners, resolveSideBanners, splitSideBanners,
 * computeSideBannerSync, leadSpanFor.
 * Liên kết trực tiếp: node:test, node:assert/strict, ../src/services/sideBanners.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FALLBACK_SIDE_BANNER_COUNTS,
  computeSideBannerSync,
  leadSpanFor,
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

test('split dùng CHUNG một tỉ lệ 4/11 cho cả hai bên (không còn tỉ lệ riêng)', () => {
  const five = [1, 2, 3, 4, 5]
  // Hai bên cùng 5 banner thì chia giống hệt nhau — vòng 1 tỉ lệ riêng
  // trái 4/11, phải 5/13 cũng cho 2/3 ở đây, nhưng 20 banner thì lệch.
  assert.deepEqual([splitSideBanners(five).before.length, splitSideBanners(five).after.length], [2, 3])
  assert.deepEqual([splitSideBanners(Array.from({ length: 10 }, (_, i) => i)).before.length, splitSideBanners(Array.from({ length: 10 }, (_, i) => i)).after.length], [4, 6])
  assert.deepEqual([splitSideBanners(Array.from({ length: 13 }, (_, i) => i)).before.length, splitSideBanners(Array.from({ length: 13 }, (_, i) => i)).after.length], [5, 8])
  assert.deepEqual([splitSideBanners(Array.from({ length: 11 }, (_, i) => i)).before.length, splitSideBanners(Array.from({ length: 11 }, (_, i) => i)).after.length], [4, 7])
  // Trường hợp vòng 1 lệch: 20 banner mỗi bên — tỉ lệ riêng cho trái 7/13,
  // phải 8/12; tỉ lệ chung cho cả hai bên đều 7/13 nên hàng ngang thẳng nhau.
  assert.deepEqual([splitSideBanners(Array.from({ length: 20 }, (_, i) => i)).before.length, splitSideBanners(Array.from({ length: 20 }, (_, i) => i)).after.length], [7, 13])
})

test('split luôn ≥ 1 banner mỗi phía khi cột có ≥ 2 banner', () => {
  assert.deepEqual([splitSideBanners([1, 2]).before.length, splitSideBanners([1, 2]).after.length], [1, 1])
  assert.deepEqual([splitSideBanners([1]).before.length, splitSideBanners([1]).after.length], [1, 0])
  assert.deepEqual([splitSideBanners([]).before.length, splitSideBanners([]).after.length], [0, 0])
})

test('computeSideBannerSync custom 20/20: hàng chung 7 trước/13 sau, hai bên span 1', () => {
  const left = Array.from({ length: 20 }, (_, i) => ({ productId: String(i + 1) }))
  const right = Array.from({ length: 20 }, (_, i) => ({ productId: String(i + 1) }))
  const sync = computeSideBannerSync(left, right)
  assert.equal(sync.rowsBefore, 7)
  assert.equal(sync.rowsAfter, 13)
  assert.equal(sync.left.beforeCount, 7)
  assert.equal(sync.left.afterCount, 13)
  assert.equal(sync.right.beforeCount, 7)
  assert.equal(sync.right.afterCount, 13)
  assert.equal(sync.left.leadBeforeSpan, 1)
  assert.equal(sync.left.leadAfterSpan, 1)
  assert.equal(sync.right.leadBeforeSpan, 1)
  assert.equal(sync.right.leadAfterSpan, 1)
})

test('computeSideBannerSync custom lệch nhau: hàng chung lấy max, bên ít span bù', () => {
  const left = Array.from({ length: 20 }, (_, i) => ({ productId: String(i + 1) }))
  const right = Array.from({ length: 5 }, (_, i) => ({ productId: String(i + 1) }))
  const sync = computeSideBannerSync(left, right)
  assert.equal(sync.rowsBefore, 7)
  assert.equal(sync.rowsAfter, 13)
  assert.deepEqual([sync.right.beforeCount, sync.right.afterCount], [2, 3])
  // Phải thiếu 5 hàng trước sale → mục đầu span 6; thiếu 10 hàng sau sale → span 11.
  assert.equal(sync.right.leadBeforeSpan, 6)
  assert.equal(sync.right.leadAfterSpan, 11)
  assert.equal(sync.left.leadBeforeSpan, 1)
  assert.equal(sync.left.leadAfterSpan, 1)
  // Tổng hàng chiếm của mỗi đoạn bằng đúng số hàng chung, không trống hàng.
  for (const entry of [sync.left, sync.right]) {
    assert.equal(entry.leadBeforeSpan + (entry.beforeCount - 1), sync.rowsBefore)
    assert.equal(entry.leadAfterSpan + (entry.afterCount - 1), sync.rowsAfter)
  }
})

test('computeSideBannerSync fallback cả hai bên: hàng chung 5 trước/8 sau, trái span 2', () => {
  assert.deepEqual(FALLBACK_SIDE_BANNER_COUNTS.left, { before: 4, after: 7 })
  assert.deepEqual(FALLBACK_SIDE_BANNER_COUNTS.right, { before: 5, after: 8 })
  const sync = computeSideBannerSync(null, null)
  assert.equal(sync.rowsBefore, 5)
  assert.equal(sync.rowsAfter, 8)
  assert.equal(sync.left.isCustom, false)
  assert.equal(sync.right.isCustom, false)
  // Trái thiếu 1 hàng mỗi đoạn → thẻ đầu trước sale span 2, offer đầu sau sale span 2.
  assert.equal(sync.left.leadBeforeSpan, 2)
  assert.equal(sync.left.leadAfterSpan, 2)
  assert.equal(sync.right.leadBeforeSpan, 1)
  assert.equal(sync.right.leadAfterSpan, 1)
})

test('computeSideBannerSync một bên custom, một bên fallback: hàng chung lấy max', () => {
  const left = [{ productId: '1' }, { productId: '2' }, { productId: '3' }]
  const sync = computeSideBannerSync(left, null)
  assert.equal(sync.rowsBefore, 5)
  assert.equal(sync.rowsAfter, 8)
  assert.deepEqual([sync.left.beforeCount, sync.left.afterCount], [1, 2])
  assert.equal(sync.left.leadBeforeSpan, 5)
  assert.equal(sync.left.leadAfterSpan, 7)
  assert.equal(sync.right.leadBeforeSpan, 1)
  assert.equal(sync.right.leadAfterSpan, 1)
})

test('leadSpanFor: đủ hàng span 1, thiếu d hàng span 1 + d, không mục span 1', () => {
  assert.equal(leadSpanFor(5, 5), 1)
  assert.equal(leadSpanFor(4, 5), 2)
  assert.equal(leadSpanFor(2, 7), 6)
  assert.equal(leadSpanFor(0, 8), 1)
})
