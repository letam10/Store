/*
  FILE NOTE
  - Mục đích: Kiểm thử unit cho src/services/sideBanners.js (giới hạn 5–30 banner mỗi bên, tùy chỉnh 10–30, clamp, normalize, resolve, split, banner mặc định, hỗ trợ cấu hình 0 banner ẩn dải rail).
  - Liên kết trực tiếp: Store/src/services/sideBanners.js.
  - Vùng ảnh hưởng khi sửa: Bộ kiểm thử đơn vị logic banner hai bên storefront.
*/

/**
 * @codex-vn-doc
 * Tệp: test/side-banners.test.js
 * Mục đích: Kiểm thử unit cho src/services/sideBanners.js (làm lại
 * từ đầu): normalize kẹp 5–30, resolve, split theo quy tắc 0.35 chung,
 * banner mặc định mới, resolve kèm mặc định.
 * Thành phần chính: normalizeSideBanners, resolveSideBanners,
 * splitSideBanners, defaultSideBanners, resolveSideBannersWithDefaults,
 * clampSideBannerCount.
 * Liên kết trực tiếp: node:test, node:assert/strict, ../src/services/sideBanners.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_SIDE_BANNER_COUNT,
  SIDE_BANNER_DEFAULT_COUNT,
  SIDE_BANNER_MAX_COUNT,
  SIDE_BANNER_MAX_PER_SIDE,
  SIDE_BANNER_MIN_COUNT,
  SIDE_BANNER_MIN_PER_SIDE,
  SIDE_BANNERS_MAX,
  clampSideBannerCount,
  defaultSideBanners,
  normalizeSideBanners,
  resolveSideBanners,
  resolveSideBannersWithDefaults,
  splitSideBanners,
} from '../src/services/sideBanners.js'

const products = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  name: 'Sản phẩm ' + (index + 1),
  price: (index + 1) * 100000,
  image: '/products/p' + (index + 1) + '.webp',
  category: 'Điện tử',
  stockCount: 20,
  viewCount: index,
  discountPercent: index === 0 ? 10 : 0,
}))

const slot = (productId, extra = {}) => ({ productId, title: '', note: '', bg: '', text: '', accent: '', ...extra })

test('giới hạn mới: mỗi bên tối thiểu 5, tối đa 30, mặc định 5', () => {
  assert.equal(SIDE_BANNER_MIN_PER_SIDE, 5)
  assert.equal(SIDE_BANNER_MAX_PER_SIDE, 30)
  assert.equal(DEFAULT_SIDE_BANNER_COUNT, 5)
  assert.equal(SIDE_BANNER_MIN_COUNT, 5)
  assert.equal(SIDE_BANNER_MAX_COUNT, 30)
  assert.equal(SIDE_BANNER_DEFAULT_COUNT, 5)
  assert.equal(SIDE_BANNERS_MAX, 30)
})

test('clampSideBannerCount kẹp 5–30, số không hợp lệ dùng mặc định 5', () => {
  assert.equal(clampSideBannerCount(3), 5)
  assert.equal(clampSideBannerCount(4), 5)
  assert.equal(clampSideBannerCount(5), 5)
  assert.equal(clampSideBannerCount(7), 7)
  assert.equal(clampSideBannerCount(10), 10)
  assert.equal(clampSideBannerCount(13), 13)
  assert.equal(clampSideBannerCount(20), 20)
  assert.equal(clampSideBannerCount(30), 30)
  assert.equal(clampSideBannerCount(35), 30)
  assert.equal(clampSideBannerCount(7.8), 7)
  for (const value of [undefined, null, Number.NaN, 'x', {}, []]) {
    assert.equal(clampSideBannerCount(value), 5)
  }
})

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

test('normalize kẹp tối đa 30 mỗi bên (giữ tối đa 30 slot đầu)', () => {
  const count25 = Array.from({ length: 25 }, (_, index) => slot(String((index % 10) + 1)))
  const normalized25 = normalizeSideBanners({ left: count25, right: count25 })
  assert.equal(normalized25.left.length, 25)
  assert.equal(normalized25.right.length, 25)

  const many = Array.from({ length: 35 }, (_, index) => slot(String((index % 30) + 1)))
  const normalized = normalizeSideBanners({ left: many, right: many })
  assert.equal(normalized.left.length, 30)
  assert.equal(normalized.right.length, 30)
  // Giữ đúng 30 slot đầu theo thứ tự đã lưu.
  assert.deepEqual(normalized.left.map(item => item.productId), many.slice(0, 30).map(item => item.productId))
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

test('split dùng CHUNG quy tắc before = max(1, round(N * 0.35)) cho cả hai bên', () => {
  // Bảng chia N=5..10: 2/3, 2/4, 2/5, 3/5, 3/6, 4/6 — không còn tỉ lệ
  // 4/11 hay 5/13 cũ, không span bù.
  const expected = { 5: [2, 3], 6: [2, 4], 7: [2, 5], 8: [3, 5], 9: [3, 6], 10: [4, 6] }
  for (const [n, [before, after]] of Object.entries(expected)) {
    const list = Array.from({ length: Number(n) }, (_, i) => i)
    assert.deepEqual(
      [splitSideBanners(list).before.length, splitSideBanners(list).after.length],
      [before, after],
      'N=' + n,
    )
  }
  // Hai bên cùng số lượng thì chia giống hệt nhau.
  const leftSplit = splitSideBanners([1, 2, 3, 4, 5])
  const rightSplit = splitSideBanners([6, 7, 8, 9, 10])
  assert.deepEqual(
    [leftSplit.before.length, leftSplit.after.length],
    [rightSplit.before.length, rightSplit.after.length],
  )
})

test('split trường hợp biên: 1 → 1/0, 2 → 1/1, 0 → 0/0', () => {
  assert.deepEqual([splitSideBanners([1]).before.length, splitSideBanners([1]).after.length], [1, 0])
  assert.deepEqual([splitSideBanners([1, 2]).before.length, splitSideBanners([1, 2]).after.length], [1, 1])
  assert.deepEqual([splitSideBanners([]).before.length, splitSideBanners([]).after.length], [0, 0])
  assert.deepEqual([splitSideBanners(null).before.length, splitSideBanners(null).after.length], [0, 0])
})

test('defaultSideBanners: giảm giá trước rồi lượt xem cao, trái chẵn/phải lẻ, không trùng', () => {
  const defaults = defaultSideBanners(products)
  // Sắp xếp: sản phẩm 1 đang giảm 10% lên đầu, rồi lượt xem giảm dần
  // 10, 9, 8, 7, 6, 5, 4, 3, 2 → trái vị trí chẵn, phải vị trí lẻ.
  assert.deepEqual(defaults.left.map(item => item.productId), ['1', '9', '7', '5', '3'])
  assert.deepEqual(defaults.right.map(item => item.productId), ['10', '8', '6', '4', '2'])
  assert.equal(defaults.left.length, 5)
  assert.equal(defaults.right.length, 5)
  // Hai bên không trùng nhau hoàn toàn (thực tế không trùng sản phẩm nào).
  const leftIds = new Set(defaults.left.map(item => item.productId))
  assert.equal(defaults.right.filter(item => leftIds.has(item.productId)).length, 0)
  // Banner mặc định dùng chung dạng với banner đã resolve.
  assert.equal(defaults.left[0].title, '')
  assert.equal(defaults.left[0].product.name, 'Sản phẩm 1')
})

test('defaultSideBanners: không chọn sản phẩm hết hàng', () => {
  const mixed = [
    { id: 'het', name: 'Hết hàng', price: 1000, stockCount: 0, viewCount: 999, discountPercent: 50 },
    ...products,
  ]
  const defaults = defaultSideBanners(mixed)
  assert.equal(defaults.left.some(item => item.productId === 'het'), false)
  assert.equal(defaults.right.some(item => item.productId === 'het'), false)
  assert.equal(defaults.left.length, 5)
  assert.equal(defaults.right.length, 5)
})

test('defaultSideBanners: ít sản phẩm thì lấy đúng số có, không đệm', () => {
  const three = defaultSideBanners(products.slice(0, 3))
  assert.deepEqual(three.left.map(item => item.productId), ['1', '2'])
  assert.deepEqual(three.right.map(item => item.productId), ['3'])
  assert.deepEqual(defaultSideBanners([]), { left: [], right: [] })
  assert.deepEqual(defaultSideBanners(null), { left: [], right: [] })
})

test('defaultSideBanners: chịu được products chưa enrich (thiếu discountPercent/viewCount)', () => {
  const plain = [{ id: 'a', name: 'A', price: 1000 }, { id: 'b', name: 'B', price: 2000 }]
  const defaults = defaultSideBanners(plain, 5)
  assert.deepEqual(defaults.left.map(item => item.productId), ['a'])
  assert.deepEqual(defaults.right.map(item => item.productId), ['b'])
})

test('resolveSideBannersWithDefaults: bên custom giữ nguyên, bên trống dùng mặc định', () => {
  const both = resolveSideBannersWithDefaults(undefined, products)
  assert.equal(both.left.length, 5)
  assert.equal(both.right.length, 5)
  const mixed = resolveSideBannersWithDefaults({ left: [slot('1'), slot('2'), slot('3')], right: [] }, products)
  assert.deepEqual(mixed.left.map(item => item.productId), ['1', '2', '3'])
  assert.equal(mixed.right.length, 5)
  assert.deepEqual(mixed.right.map(item => item.productId), ['10', '8', '6', '4', '2'])
  // Cấu hình 13 slot/bên giữ nguyên 13 slot, chia 5 trước/8 sau.
  const thirteen = resolveSideBannersWithDefaults({
    left: Array.from({ length: 13 }, (_, i) => slot(String((i % 10) + 1))),
    right: Array.from({ length: 13 }, (_, i) => slot(String((i % 10) + 1))),
  }, products)
  assert.equal(thirteen.left.length, 13)
  assert.equal(thirteen.right.length, 13)
  assert.deepEqual(
    [splitSideBanners(thirteen.left).before.length, splitSideBanners(thirteen.left).after.length],
    [5, 8],
  )

  // Cấu hình tối đa 30 slot/bên giữ nguyên 30 slot, chia 11 trước/19 sau.
  const thirty = resolveSideBannersWithDefaults({
    left: Array.from({ length: 30 }, (_, i) => slot(String((i % 10) + 1))),
    right: Array.from({ length: 30 }, (_, i) => slot(String((i % 10) + 1))),
  }, products)
  assert.equal(thirty.left.length, 30)
  assert.equal(thirty.right.length, 30)
  assert.deepEqual(
    [splitSideBanners(thirty.left).before.length, splitSideBanners(thirty.left).after.length],
    [11, 19],
  )

  // Cấu hình 0 banner mỗi bên (count = 0) trả về mảng rỗng ẩn hoàn toàn
  const zeroObj = resolveSideBannersWithDefaults({ version: 1, count: 0, left: [], right: [] }, products)
  assert.equal(zeroObj.left.length, 0)
  assert.equal(zeroObj.right.length, 0)

  const zeroJson = resolveSideBannersWithDefaults('{"version":1,"count":0,"left":[],"right":[]}', products)
  assert.equal(zeroJson.left.length, 0)
  assert.equal(zeroJson.right.length, 0)
})
