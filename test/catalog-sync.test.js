/*
  FILE NOTE
  - Mục đích: Kiểm thử việc đồng bộ danh mục sản phẩm giữa Admin và Storefront (khi Admin thêm hoặc xóa sản phẩm).
  - Liên kết trực tiếp: Store/src/services/catalog.js, Store/src/data/products.js
  - Vùng ảnh hưởng khi sửa: Độ chính xác số lượng sản phẩm hiển thị khi xóa/thêm sản phẩm trong DB.
*/

import assert from 'node:assert/strict'
import test from 'node:test'
import { enrichProducts } from '../src/services/catalog.js'
import { products as sourceProducts } from '../src/data/products.js'

test('enrichProducts: giữ nguyên 500 sản phẩm demo khi không có API kết nối (offline fallback)', () => {
  const list = enrichProducts([])
  assert.equal(list.length, sourceProducts.length)
  assert.equal(list.length, 500)
})

test('enrichProducts: phản ánh chính xác số lượng sản phẩm khi Admin xóa sản phẩm trong database (ví dụ còn 498 sản phẩm)', () => {
  // Giả lập API DB trả về 498 sản phẩm (đã xóa 2 sản phẩm có id "1" và "2")
  const apiOffers = sourceProducts.filter((p) => String(p.id) !== '1' && String(p.id) !== '2').map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stockCount: 15,
    viewCount: 10,
    favoriteCount: 5,
  }))

  assert.equal(apiOffers.length, 498)

  // Khi nạp fullCatalog từ API DB
  const list = enrichProducts(apiOffers, { fullCatalog: true })
  assert.equal(list.length, 498)
  assert.equal(list.some((p) => String(p.id) === '1'), false)
  assert.equal(list.some((p) => String(p.id) === '2'), false)
})

test('enrichProducts: phản ánh chính xác số lượng sản phẩm khi Admin thêm sản phẩm mới (ví dụ 501 sản phẩm)', () => {
  const newProduct = {
    id: 'sp_moi_999',
    name: 'Sản phẩm mới thêm bởi Admin',
    category: 'Điện tử',
    price: 250000,
    discountPercent: 10,
    stockCount: 50,
    viewCount: 0,
    favoriteCount: 0,
  }

  const apiOffers = [
    ...sourceProducts.map((p) => ({ id: p.id, price: p.price })),
    newProduct,
  ]

  assert.equal(apiOffers.length, 501)

  const list = enrichProducts(apiOffers, { fullCatalog: true })
  assert.equal(list.length, 501)
  const found = list.find((p) => String(p.id) === 'sp_moi_999')
  assert.ok(found)
  assert.equal(found.name, 'Sản phẩm mới thêm bởi Admin')
  assert.equal(found.price, 225000) // 250000 - 10%
})

test('enrichProducts: tự động nhận diện fullCatalog khi số lượng sản phẩm từ API > 50 dù không truyền options', () => {
  const apiOffers = sourceProducts.slice(0, 498).map((p) => ({ id: p.id, price: p.price }))
  const list = enrichProducts(apiOffers)
  assert.equal(list.length, 498)
})
