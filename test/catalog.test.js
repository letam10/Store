/**
 * @codex-vn-doc
 * Tệp: test/catalog.test.js
 * Mục đích: Tệp kiểm thử tự động cho các luồng chính và tình huống biên của module này.
 * Thành phần chính: các hàm/lớp và xử lý nội bộ trong tệp.
 * Liên kết trực tiếp: node:assert/strict, node:test, ../src/services/catalog.js.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { CATALOG_PAGE_SIZE, displayCategory, enrichProducts, featuredSaleProducts, generatePaginationItems, mostViewed, similarProducts } from '../src/services/catalog.js'

test('giá và thông tin admin cập nhật thay dữ liệu nền ở trang khách hàng', () => {
  const product = enrichProducts([{ id: '2', name: 'Túi đã cập nhật', category: 'Tự Thiết Kế', price: 10000, discountPercent: 10, stockCount: 8, image: '/products/current.svg' }]).find(item => String(item.id) === '2')
  assert.equal(product.originalPrice, 10000)
  assert.equal(product.price, 9000)
  assert.equal(product.name, 'Túi đã cập nhật')
  assert.equal(product.category, 'Tự Thiết Kế')
  assert.equal(product.image, '/products/current.svg')
})

// Kiểm thử edge case: demo catalog groups jewelry, apparel, laptops, electronics and components.
test('demo catalog groups jewelry, apparel, laptops, electronics and components', () => {
  assert.equal(displayCategory({ name: 'Gold Pendant Necklace', category: 'Chưa phân loại' }), 'Trang sức')
  assert.equal(displayCategory({ name: 'Dress Pump', category: 'Chưa phân loại' }), 'Trang phục')
  assert.equal(displayCategory({ name: 'Laptop', category: 'Chưa phân loại' }), 'Laptop')
  assert.equal(displayCategory({ name: 'Phone Charger Cable', category: 'Chưa phân loại' }), 'Linh kiện')
  assert.equal(displayCategory({ name: 'Laptop', category: 'Công nghệ' }), 'Điện tử')
  assert.equal(displayCategory({ name: 'Phone Charger Cable', category: 'Công nghệ' }), 'Điện tử')
  assert.equal(displayCategory({ name: 'Coffee Table', category: 'Đời sống' }), 'Đồ gia dụng')
  assert.equal(displayCategory({ name: 'Custom artwork', category: 'Tự Thiết Kế' }), 'Tự Thiết Kế')
})

// Kiểm thử edge case: danh mục chuẩn không bị tên sản phẩm ghi đè.
test('canonical categories take precedence over name heuristics', () => {
  assert.equal(displayCategory({ name: 'USB Charging Cable', category: 'Điện tử' }), 'Điện tử')
  assert.equal(displayCategory({ name: 'Gold Pendant Necklace', category: 'Trang sức' }), 'Trang sức')
  assert.equal(displayCategory({ name: 'Coffee Mug', category: 'Tự Thiết Kế' }), 'Tự Thiết Kế')
  assert.equal(displayCategory({ name: 'Chocolate Gift Box', category: 'Thực phẩm' }), 'Tự Thiết Kế')
})

// Kiểm thử edge case: gợi ý cùng danh mục giới hạn 20 món, không lặp món hiện tại hoặc hết hàng.
test('similar products cap results and keep the current category', () => {
  const current = { id: 'current', name: 'Current', category: 'Điện tử', stockCount: 1 }
  const sameCategory = Array.from({ length: 25 }, (_, index) => ({ id: `same-${index}`, name: `Same ${index}`, category: 'Điện tử', stockCount: 1 }))
  const otherCategory = { id: 'other', name: 'Other', category: 'Trang phục', stockCount: 1 }
  const soldOut = { id: 'sold-out', name: 'Sold out', category: 'Điện tử', stockCount: 0 }
  const result = similarProducts([current, ...sameCategory, otherCategory, soldOut], current, 20)
  assert.equal(result.length, 20)
  assert.equal(new Set(result.map((product) => product.id)).size, 20)
  assert.ok(result.every((product) => product.category === current.category && product.stockCount !== 0 && product.id !== current.id))
})

// Kiểm thử edge case: manifest giữ sale thật, offer Admin ghi đè và view ranking loại hết kho.
test('admin offer overrides demo discount and view ranking excludes out of stock', () => {
  const imported = enrichProducts()
  assert.equal(imported.length, 500)
  for (const [category, expected] of Object.entries({ 'Điện tử': 84, 'Đồ gia dụng': 70, 'Linh kiện': 84, 'Trang phục': 69, 'Trang sức': 84, 'Làm đẹp': 57 })) {
    assert.equal(imported.filter((product) => product.category === category).length, expected)
  }
  assert.equal(imported.filter((product) => product.category === 'Tự Thiết Kế').length, 39)
  assert.equal(imported.filter((product) => product.category === 'Thực phẩm').length, 0)
  assert.equal(imported.filter((product) => String(product.id).startsWith('custom-design-')).length, 0)
  assert.equal(imported[4].discountPercent, 0)
  assert.equal(imported.filter((product) => product.discountPercent > 0).length, 52)
  const featured = featuredSaleProducts(imported, 10)
  assert.equal(featured.length, 10)
  assert.ok(featured.every((product) => product.discountPercent > 0 && product.stockCount !== 0))
  const changed = enrichProducts([{ id: imported[4].id, discountPercent: 20, stockCount: 0, viewCount: 100 }, { id: imported[5].id, discountPercent: 5, stockCount: 2, viewCount: 10 }])
  assert.equal(changed[4].price, Math.round(changed[4].originalPrice * .8 / 10) * 10)
  assert.equal(changed[4].stockCount, 0)
  assert.equal(mostViewed(changed, 1)[0].id, imported[5].id)
  assert.ok(similarProducts(changed, changed[4]).every((item) => item.stockCount !== 0 && item.category === changed[4].category))
})

// Kiểm thử phân trang danh mục sản phẩm: 15 sản phẩm/trang, đầy đủ 500 sản phẩm với 34 trang.
test('catalog pagination enforces 15 items per page and computes pages through 500 items', () => {
  assert.equal(CATALOG_PAGE_SIZE, 15)
  const allProducts = enrichProducts()
  assert.equal(allProducts.length, 500)

  const totalPages = Math.ceil(allProducts.length / CATALOG_PAGE_SIZE)
  assert.equal(totalPages, 34)

  // Trang 1: 15 sản phẩm đầu tiên
  const page1 = allProducts.slice(0, CATALOG_PAGE_SIZE)
  assert.equal(page1.length, 15)

  // Trang cuối 34: 5 sản phẩm còn lại
  const page34 = allProducts.slice((34 - 1) * CATALOG_PAGE_SIZE, 34 * CATALOG_PAGE_SIZE)
  assert.equal(page34.length, 5)

  // Phân bổ các nút phân trang cho các trường hợp
  // Trường hợp ít hơn hoặc bằng 7 trang
  assert.deepEqual(generatePaginationItems(1, 5), [1, 2, 3, 4, 5])
  assert.deepEqual(generatePaginationItems(3, 7), [1, 2, 3, 4, 5, 6, 7])

  // Trường hợp ở đầu (trang 1..4 của 34 trang)
  assert.deepEqual(generatePaginationItems(1, 34), [1, 2, 3, 4, 5, '...', 34])
  assert.deepEqual(generatePaginationItems(4, 34), [1, 2, 3, 4, 5, '...', 34])

  // Trường hợp ở giữa (trang 10 của 34 trang)
  assert.deepEqual(generatePaginationItems(10, 34), [1, '...', 9, 10, 11, '...', 34])

  // Trường hợp ở cuối (trang 32, 34 của 34 trang)
  assert.deepEqual(generatePaginationItems(32, 34), [1, '...', 30, 31, 32, 33, 34])
  assert.deepEqual(generatePaginationItems(34, 34), [1, '...', 30, 31, 32, 33, 34])
})

